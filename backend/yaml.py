"""
Pure Python YAML wrapper for Python 3.15 compatibility using ruamel.yaml
"""
import io
import ruamel.yaml

_yaml = ruamel.yaml.YAML(typ='safe')
_yaml.default_flow_style = False

class SafeDumper:
    @classmethod
    def add_representer(cls, data_type, representer):
        pass

class Dumper(SafeDumper):
    pass

def dump(data, stream=None, Dumper=None, default_flow_style=False, sort_keys=False, **kwargs):
    buf = io.StringIO()
    _yaml.dump(data, buf)
    res = buf.getvalue()
    if stream is not None:
        stream.write(res)
        return None
    return res

def safe_dump(data, stream=None, **kwargs):
    return dump(data, stream=stream, **kwargs)

def safe_load(stream):
    return _yaml.load(stream)

def load(stream, Loader=None):
    return _yaml.load(stream)
