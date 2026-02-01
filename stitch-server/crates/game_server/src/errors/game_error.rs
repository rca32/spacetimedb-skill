#[derive(Clone, Debug)]
pub enum GameError {
    Unauthorized,
    Forbidden,
    NotFound,
    InvalidInput,
    RateLimited,
    Conflict,
    Internal,
}

impl GameError {
    pub fn as_str(&self) -> &'static str {
        match self {
            GameError::Unauthorized => "Unauthorized",
            GameError::Forbidden => "Forbidden",
            GameError::NotFound => "NotFound",
            GameError::InvalidInput => "InvalidInput",
            GameError::RateLimited => "RateLimited",
            GameError::Conflict => "Conflict",
            GameError::Internal => "Internal",
        }
    }
}

impl From<GameError> for String {
    fn from(value: GameError) -> Self {
        value.as_str().to_string()
    }
}
