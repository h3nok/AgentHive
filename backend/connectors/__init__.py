from .ukg import UKGConnector

CONNECTOR_REGISTRY = {
    "ukg": UKGConnector,
}

def get_connector(name, **kwargs):
    return CONNECTOR_REGISTRY[name](**kwargs) 