use std::path::PathBuf;

#[derive(Debug, Clone)]
pub struct TokenStore {
    pub path: PathBuf,
    pub token: Option<String>,
}

impl TokenStore {
    pub fn from_env() -> Self {
        let path = std::env::var("STITCH_CLIENT_TOKEN_FILE")
            .map(PathBuf::from)
            .unwrap_or_else(|_| PathBuf::from(".stitch-client/token.txt"));

        let token = std::fs::read_to_string(&path)
            .ok()
            .map(|value| value.trim().to_string())
            .filter(|value| !value.is_empty());

        Self { path, token }
    }

    pub fn save(&self, token: &str) -> std::io::Result<()> {
        if let Some(parent) = self.path.parent() {
            std::fs::create_dir_all(parent)?;
        }
        std::fs::write(&self.path, token)
    }
}
