import { 
    establishConnection, 
    establishPayer,
    checkEcomProgram, 
    setAddressProgramParams,
    initializeAddressPDA, 
    updateAddress, 
    getAddress,
    setProfileProgramParams,
    profilePDAInitialize,
    updateProfile
} from "./index";

const main = async() => {
    await establishConnection();
    await establishPayer();
    await checkEcomProgram();
    await setAddressProgramParams();
    // await initializeAddressPDA();
    await updateAddress("25 Vialdo, RSM, CA, India");
    // await getAddress();
   
    // await setUpProfileProgramParams();
    // await profilePDAInitialize();
    // await updateProfile("John Smith", 1, 1, 1970);
    
}

main()