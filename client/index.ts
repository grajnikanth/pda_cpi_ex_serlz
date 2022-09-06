import {
    Keypair,
    Connection,
    PublicKey,
    LAMPORTS_PER_SOL,
    SystemProgram,
    TransactionInstruction,
    Transaction,
    sendAndConfirmTransaction,
  } from '@solana/web3.js';
import * as borsh from 'borsh';
import {getPayer, getRpcUrl} from './utils';

const MAX_SIZE = 1000;

const ECOM_CONTRACT_ID = "Grcp6Yu6kMGGBW9QXhvbGmmdVKW7xozrp4h7VXFDJD88";
const ADDRESS_CONTRACT_ID = "6TQChuizuE3CWd7zECAqszW821uJ8Pe8c9mf6bvveVqm";
const PROFILE_CONTRACT_ID = "HHm78FyyA8jdnDPCqZnCwdpJkd1te5V35gt5azBwuwKW";

let connection;
let payer: Keypair;
let ecomProgramId: PublicKey;
let addressProgramId: PublicKey;
let addressAccountPDA: PublicKey;
let profileProgramId: PublicKey;
let profileAccountPDA: PublicKey;

class AddressAccount {
    address : Uint8Array = new Uint8Array([]);
    constructor(fields: {address: Uint8Array} | undefined = undefined) {
        if (fields) {
            this.address = fields.address;
        }
    }
}

class ProfileAccount {
    name: Uint8Array = new Uint8Array([]);
    // borsh npm document says u32 borsh is mapped to number on typescript
    date: number;
    month: number;
    year: number;

    constructor(fields: {
        name: Uint8Array,
        date: number,
        month: number,
        year: number
    } | undefined = undefined) {
        if(fields) {
            this.name = fields.name;
            this.date = fields.date;
            this.month = fields.month;
            this.year = fields.year;
        }
    };
}

const AddressSchema = new Map([
    [AddressAccount, {kind: 'struct', fields: [['address', [512]]]}],
]);

const ProfileSchema = new Map([
    [ProfileAccount, {
        kind: 'struct', 
        fields: [
                ['name', [64]], 
                ['date', 'u32'],
                ['month', 'u32'],
                ['year', 'u32']
        ]}]
]);


const strToBuffer = (str, len) => {
    const buf = Buffer.alloc(len);
    buf.write(str);
    console.log("After buf.write, buf = ", buf);
    return buf;
}

const numberToBuffer = (value, len) => {
    const buf = Buffer.alloc(len);
    buf.writeUInt32LE(value);
    console.log("4 bytes of  number ", buf);
    return buf;
}


/**
 * Establish a connection to the cluster
 */
 export async function establishConnection(): Promise<void> {
    const rpcUrl = await getRpcUrl();
    connection = new Connection(rpcUrl, 'confirmed');
    const version = await connection.getVersion();
    console.log('Connection to cluster established:', rpcUrl, version);
  }
  

/**
 * Establish an account to pay for everything
 */
export async function establishPayer(): Promise<void> {
    let fees = 0;
    if (!payer) {
      const {feeCalculator} = await connection.getRecentBlockhash();
  
      // Calculate the cost to fund the greeter account
      fees += await connection.getMinimumBalanceForRentExemption(MAX_SIZE);
  
      // Calculate the cost of sending transactions
      fees += feeCalculator.lamportsPerSignature * 100; // wag
  
      payer = await getPayer();
    }
  
    let lamports = await connection.getBalance(payer.publicKey);
    if (lamports < fees) {
      // If current balance is not enough to pay for fees, request an airdrop
      const sig = await connection.requestAirdrop(
        payer.publicKey,
        fees - lamports,
      );
      await connection.confirmTransaction(sig);
      lamports = await connection.getBalance(payer.publicKey);
    }
  
    console.log(
      'Using account',
      payer.publicKey.toBase58(),
      'containing',
      lamports / LAMPORTS_PER_SOL,
      'SOL to pay for fees',
    );
}

/**
 * Check if the ecom-contract and address-contract BPF programs have been deployed
 */
 export async function checkEcomProgram(): Promise<void> {
    ecomProgramId = new PublicKey(ECOM_CONTRACT_ID);

    const ecomProgramInfo = await connection.getAccountInfo(ecomProgramId);
    if (ecomProgramInfo === null) {
        throw new Error(`Ecom program not found`);
    } else if (!ecomProgramInfo.executable) {
        throw new Error(`Ecom program is not executable`);
    }
    console.log(`Ecom program ID being used is ${ecomProgramId.toBase58()}`);
}



/**
 * Check if the ecom-contract and address-contract BPF programs have been deployed
 */
 export async function setAddressProgramParams(): Promise<void> {
    addressProgramId = new PublicKey(ADDRESS_CONTRACT_ID);

    const addressProgramInfo = await connection.getAccountInfo(addressProgramId);
    if (addressProgramInfo === null) {
        throw new Error(`Address program not found`);
    } else if (!addressProgramInfo.executable) {
        throw new Error(`Address program is not executable`);
    }
    console.log(`Address program ID being used is ${addressProgramId.toBase58()}`);

    addressAccountPDA = (await PublicKey.findProgramAddress(
        [Buffer.from("address"), payer.publicKey.toBytes()],
        ecomProgramId,
    ))[0];
    console.log(`Address Account PDA is ${addressAccountPDA.toBase58()}`)
}

// check if profile-contract has been deployed and create PDA for profile account
export async function setProfileProgramParams(): Promise<void> {
    profileProgramId = new PublicKey(PROFILE_CONTRACT_ID);

    const profileProgramInfo = await connection.getAccountInfo(profileProgramId);
    if (profileProgramId === null) {
        throw new Error(`Profile program not found`);
    } else if (!profileProgramInfo.executable) {
        throw new Error(`Profile program is not executable`);
    }
    console.log(`Profile program ID being used is ${profileProgramId.toBase58()}`);

    profileAccountPDA = (await PublicKey.findProgramAddress(
        [Buffer.from("profile"), payer.publicKey.toBytes()],
        ecomProgramId
    ))[0];
    console.log(`Profile Account PDA is ${profileAccountPDA.toBase58()}`);
}

export async function initializeAddressPDA(): Promise<void> {
    const buffers = [Buffer.from(Int8Array.from([1]))];
    const data = Buffer.concat(buffers);
    const instruction = new TransactionInstruction({
        keys: [
            {pubkey: payer.publicKey, isSigner: true, isWritable: true},
            {pubkey: addressAccountPDA, isSigner: false, isWritable: true},
            {pubkey: addressProgramId, isSigner: false, isWritable: false},
            {pubkey: SystemProgram.programId, isSigner: false, isWritable: false}
        ],
        programId: ecomProgramId,
        data: data
    });
    await sendAndConfirmTransaction(
        connection,
        new Transaction().add(instruction),
        [payer],
    );
}

// function to initialize profile PDA account on chain
export async function profilePDAInitialize(): Promise<void> {
    // variant index 2 is the profile address Initialize instruction in ecom contract
    const buffers = [Buffer.from(Int8Array.from([2]))];
    const data = Buffer.concat(buffers);
    const instruction = new TransactionInstruction({
        keys: [
            {pubkey: payer.publicKey, isSigner: true, isWritable: true},
            {pubkey: profileAccountPDA, isSigner: false, isWritable: true},
            {pubkey: profileProgramId, isSigner: false, isWritable: false},
            {pubkey: SystemProgram.programId, isSigner: false, isWritable: false}
        ],
        programId: ecomProgramId,
        data: data
    });

    await sendAndConfirmTransaction(
        connection,
        new Transaction().add(instruction),
        [payer]
    );
}

// Function to convert string to class AddressAccount to a Borsh Serialized buffer 
export const createAddressBuffer = (address: string) => {
    let strLength = address.length;
    let buffer = new ArrayBuffer(512);

    //512 bytes long Uint8Array
    let addressUint8Array = new Uint8Array(buffer); 
   
    if(strLength > 512) {
        throw new Error(`Address string is too long > 512 bytes, revise`); 
    } 
   
    let encoder = new TextEncoder();
    let addressArrayBuffer = encoder.encode(address);
    
    // Take the addressArrayBuffer and place at the front of the 512 Uint8Array buffer
    addressUint8Array.set(addressArrayBuffer, 0);
    let addressAccountInstance = new AddressAccount({address: addressUint8Array});
    console.log('addressAccountInstance is ', addressAccountInstance);

    // Borsh Serialize the instance to corresponding struct mapping
    const addressAccountSerialized = borsh.serialize(AddressSchema, addressAccountInstance);
    console.log('Borsh serialized Uint8Array is ', addressAccountSerialized);
    const addressAccountBuffer = Buffer.from(addressAccountSerialized);
    console.log('addressAccountBuffer is ', addressAccountBuffer);
    return addressAccountBuffer;

}

export const updateAddress = async (address: string) => {
    
    const buffer2 = createAddressBuffer(address);
    // ecom-contract instructionData enum updateAddress field is the first. So first bytes
    // shall be set to 0. Next need a 512 bytes to represent the new address
    const buffers = [Buffer.from(Int8Array.from([0])), buffer2];
    console.log("Buffer array buffers = ", buffers);
    // Buffer.concat takes all buffers objects in an array and converts into one 
    // buffer object. Transaction instruction takes a buffer as data. So below
    // is needed to convert an array to a buffer
    const data = Buffer.concat(buffers);
    console.log("Data buffer for Address update Instruction data", data);
    
    const instruction = new TransactionInstruction({
        keys: [
            {pubkey: payer.publicKey, isSigner: true, isWritable: true},
            {pubkey: addressAccountPDA, isSigner: false, isWritable: true},
            {pubkey: addressProgramId, isSigner: false, isWritable: false},
        ],
        programId: ecomProgramId,
        data: data
    });
    await sendAndConfirmTransaction(
        connection,
        new Transaction().add(instruction),
        [payer],
    );
}

// Function to convert string to class AddressAccount to a Borsh Serialized buffer 
export const createProfileBuffer = (name: string, date: number, month: number, year: number) => {
    let strLength = name.length;
    let buffer = new ArrayBuffer(64);

    //512 bytes long Uint8Array
    let profileUint8Array = new Uint8Array(buffer); 
   
    if(strLength > 64) {
        throw new Error(`Name string is too long > 64 bytes, revise`); 
    } 
   
    let encoder = new TextEncoder();
    let profileArrayBuffer = encoder.encode(name);
    
    // Take the addressArrayBuffer and place at the front of the 512 Uint8Array buffer
    profileUint8Array.set(profileArrayBuffer, 0);
    let profileAccountInstance = new ProfileAccount({
        name: profileUint8Array,
        date: date,
        month: month,
        year: year
    });
    console.log('profileAccountInstance is ', profileAccountInstance);

    // Borsh Serialize the instance to corresponding struct mapping
    const profileAccountSerialized = borsh.serialize(ProfileSchema, profileAccountInstance);
    console.log('Borsh serialized Uint8Array is ', profileAccountSerialized);
    const profileAccountBuffer = Buffer.from(profileAccountSerialized);
    console.log('profileAccountBuffer is ', profileAccountBuffer);
    console.log('date bytes from the profile buffer ',profileAccountBuffer.slice(64,68));
    console.log('month bytes from the profile buffer ',profileAccountBuffer.slice(68,72));
    console.log('Year bytes from the profile buffer ',profileAccountBuffer.slice(72));
    return profileAccountBuffer;

}

export const updateProfile = async(name: string, date: number, month: number, year: number) => {
    
    let buffer2 = createProfileBuffer(name, date, month, year);
    const buffers = [
        Buffer.from(Uint8Array.from([3])), 
        buffer2
    ];
    console.log('buffers value = ', buffers);
    const data = Buffer.concat(buffers);
    console.log("Instruction data buffer in updateProfile function is ", data);

    const instruction = new TransactionInstruction({
        keys: [
            {pubkey: payer.publicKey, isSigner: true, isWritable: true},
            {pubkey: profileAccountPDA, isSigner: false, isWritable: true},
            {pubkey: profileProgramId, isSigner: false, isWritable: false}
        ],
        programId: ecomProgramId,
        data: data
    });

    await sendAndConfirmTransaction(
        connection,
        new Transaction().add(instruction),
        [payer]
    );
}

export const getAddress = async () => {
    const accountInfo = await connection.getAccountInfo(addressAccountPDA);
    const address = borsh.deserialize(
        AddressSchema,
        AddressAccount,
        accountInfo.data,
    );

    console.log("AccountInfo<buffer> from blockchain is ", accountInfo);
    console.log("PDA account data from Blockchain ", accountInfo.data);
    console.log("AddressAccount instance address is ", address);    
    console.log("address.address after deserialization from borsh", address.address)

    // looks like TextDecoder converts bytes to text
    console.log("Decoded - convert above bytes to UTF-8 string")
    console.log(new TextDecoder().decode(address.address))
}

export const getProfile = async () => {
    const accountInfo = await connection.getAccountInfo(profileAccountPDA);
    const profile = borsh.deserialize(
        ProfileSchema,
        ProfileAccount,
        accountInfo.data,
    );

    console.log("AccountInfo<buffer> from blockchain is ", accountInfo);
    console.log("PDA account data from Blockchain ", accountInfo.data);
    console.log("ProfileAccount instance address is ", profile);    
    console.log("profile.name after deserialization from borsh", profile.name);

    // looks like TextDecoder converts bytes to text
    console.log("Decoded - convert above bytes to UTF-8 string");
    console.log(new TextDecoder().decode(profile.name));
}

