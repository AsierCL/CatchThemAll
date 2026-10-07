from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from typing import ClassVar as _ClassVar, Optional as _Optional

DESCRIPTOR: _descriptor.FileDescriptor

class CaptureIdentifyRequest(_message.Message):
    __slots__ = ("image", "name")
    IMAGE_FIELD_NUMBER: _ClassVar[int]
    NAME_FIELD_NUMBER: _ClassVar[int]
    image: bytes
    name: str
    def __init__(self, image: _Optional[bytes] = ..., name: _Optional[str] = ...) -> None: ...

class CaptureIdentifyResponse(_message.Message):
    __slots__ = ("similarity",)
    SIMILARITY_FIELD_NUMBER: _ClassVar[int]
    similarity: float
    def __init__(self, similarity: _Optional[float] = ...) -> None: ...
