FROM parity/parity:v2.4.5

WORKDIR /stuff

COPY . .

CMD ["--chain", "chain.json", "--network-id", "77", "--jsonrpc-apis", "all", "--jsonrpc-interface", "all", "--jsonrpc-cors", "all", "--jsonrpc-hosts", "all"]
