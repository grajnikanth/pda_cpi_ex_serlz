import { 
    establishConnection, 
    establishPayer,
    checkEcomProgram, 
    setAddressProgramParams,
    initializeAddressPDA, 
    updateAddress, 
    createAddressBuffer,
    getAddress,
    setProfileProgramParams,
    profilePDAInitialize,
    updateProfile,
    createProfileBuffer,
    getProfile
} from "./index";

const main = async() => {
    await establishConnection();
    await establishPayer();
    await checkEcomProgram();
    // await setAddressProgramParams();
    // await initializeAddressPDA();
    // await updateAddress("1243 via moulton parkway, Laguna Niguel, CA, USA");
    // await getAddress();
    // createAddressBuffer("25 Vialdo, RSM, CA, Italy");
   
    await setProfileProgramParams();
    // await profilePDAInitialize();
    // createProfileBuffer("John Smith", 1, 1, 1970);
    // await updateProfile("John Smith", 1, 1, 1970);
    await getProfile();
    
}

main()