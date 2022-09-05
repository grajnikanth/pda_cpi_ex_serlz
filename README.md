# Solana smart contract - PDAs, CPI and Serialization

This project was bootstrapped from [Youtube Tutorial on PDAs and CPIs ](https://www.youtube.com/watch?v=p0eD29d8JCM). In this project, I built on top of existing code from the tutorial to learn the following
1. Program Derived Addresses (PDAs) in Solana
2. Cross Program Invocation (CPIs) in Solana
3. Implement various methods of sending data buffers to Smart contract
4. Use of Borsh Serialization in client code to map Classes in Typescript to Structs of Smart contracts
5. Use of Borsh to serialize data in client code to send to smart contract

## Smart Contract Notes
Run local solana validator and watch for solana logs on two separate terminals using commands
### `solana-test-validator`
### `solana logs`

In each of the smart contract folders, compile code using following command and then deploy smart contract

### `cargo build-bpf`

## Client code notes
Intall dependencies in the client folder, compile code and run code using following commands. Copy the deployed smart contract ProgramID into the appropriate variables in the client code. Edit client code as needed per the action which nned to be performed, such as initializing AddressAccount PDA or ProfileAccount PDA etc.

### `npm install`
### `npm run build`
### `npm run start`
