use solana_program::{program_error::ProgramError};

pub enum EcomInstructionData {
    UpdateAdddress,
    InitializeAddressPDA,
    InitializeUserProfilePDA,
    UpdateUserInfo
}

impl EcomInstructionData {
    pub fn unpack(input: &u8) -> Result<Self, ProgramError> {
        
        match input {
            0 => return Ok(EcomInstructionData::UpdateAdddress),
            1 => return Ok(EcomInstructionData::InitializeAddressPDA),
            2 => return Ok(EcomInstructionData::InitializeUserProfilePDA),
            3 => return Ok(EcomInstructionData::UpdateUserInfo),
            _ => Err(ProgramError::InvalidInstructionData)
        }
    }
}


