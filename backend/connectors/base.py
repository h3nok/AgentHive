class BaseConnector:
    def call(self, action: str, params: dict) -> dict:
        raise NotImplementedError 