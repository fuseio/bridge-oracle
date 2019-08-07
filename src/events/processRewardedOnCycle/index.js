require('dotenv').config()
const rootLogger = require('../../services/logger')
const { web3Home } = require('../../services/web3')
const promiseLimit = require('promise-limit')
const bridgeValidatorsABI = require('../../../abis/BridgeValidators.abi')
const { EXIT_CODES, MAX_CONCURRENT_EVENTS } = require('../../utils/constants')
const estimateGas = require('./estimateGas')
const {
  AlreadyProcessedError,
  AlreadySignedError,
  InvalidValidatorError
} = require('../../utils/errors')
const { HttpListProviderError } = require('http-list-provider')

const limit = promiseLimit(MAX_CONCURRENT_EVENTS)

let validatorContract = null

function processRewardedOnCycleBuilder(config) {
  const homeBridge = new web3Home.eth.Contract(config.homeBridgeAbi, config.homeBridgeAddress)

  return async function processRewardedOnCycle(
    rewardedOnCycleEvents,
    homeBridgeAddress,
    foreignBridgeAddress
  ) {
    const homeBridge = new web3Home.eth.Contract(config.homeBridgeAbi, homeBridgeAddress)
    const txToSend = []

    if (expectedMessageLength === null) {
      expectedMessageLength = await homeBridge.methods.requiredMessageLength().call()
    }

    if (validatorContract === null) {
      rootLogger.debug('Getting validator contract address')
      const validatorContractAddress = await homeBridge.methods.validatorContract().call()
      rootLogger.debug({ validatorContractAddress }, 'Validator contract address obtained')

      validatorContract = new web3Home.eth.Contract(bridgeValidatorsABI, validatorContractAddress)
    }

    rootLogger.debug(`Processing ${rewardedOnCycleEvents.length} SignatureRequest events`)
    const callbacks = rewardedOnCycleEvents.map(rewardedOnCycle =>
      limit(async () => {
        const { value } = rewardedOnCycle.returnValues

        const logger = rootLogger.child({
          eventTransactionHash: rewardedOnCycle.transactionHash
        })

        logger.info(
          { value },
          `Processing rewardedOnCycle ${rewardedOnCycle.transactionHash}`
        )

        const message = createMessage({
          foreignBridgeAddress, // we will mint the tokens and lock them on foreign bridge
          value,
          transactionHash: rewardedOnCycle.transactionHash,
          bridgeAddress: foreignBridgeAddress,
          expectedMessageLength
        })

        const signature = web3Home.eth.accounts.sign(message, `0x${VALIDATOR_ADDRESS_PRIVATE_KEY}`)

        let gasEstimate
        try {
          logger.debug('Estimate gas')
          gasEstimate = await estimateGas({
            web3: web3Home,
            homeBridge,
            validatorContract,
            signature: signature.signature,
            message,
            address: config.validatorAddress
          })
          logger.debug({ gasEstimate }, 'Gas estimated')
        } catch (e) {
          if (e instanceof HttpListProviderError) {
            throw new Error(
              'RPC Connection Error: submitSignature Gas Estimate cannot be obtained.'
            )
          } else if (e instanceof InvalidValidatorError) {
            logger.fatal({ address: config.validatorAddress }, 'Invalid validator')
            process.exit(EXIT_CODES.INCOMPATIBILITY)
          } else if (e instanceof AlreadySignedError) {
            logger.info(`Already signed rewardedOnCycle ${rewardedOnCycle.transactionHash}`)
            return
          } else if (e instanceof AlreadyProcessedError) {
            logger.info(
              `rewardedOnCycle ${
                rewardedOnCycle.transactionHash
              } was already processed by other validators`
            )
            return
          } else {
            logger.error(e, 'Unknown error while processing transaction')
            throw e
          }
        }

        const data = await homeBridge.methods
          .submitSignature(signature.signature, message)
          .encodeABI({ from: config.validatorAddress })

        txToSend.push({
          data,
          gasEstimate,
          transactionReference: rewardedOnCycle.transactionHash,
          to: homeBridgeAddress
        })
      })
    )

    await Promise.all(callbacks)
    return txToSend
  }
}

module.exports = processRewardedOnCycleBuilder