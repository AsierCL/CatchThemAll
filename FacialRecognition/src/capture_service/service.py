from .generated import capture_pb2_grpc, capture_pb2

class CaptureService(capture_pb2_grpc.CaptureServiceServicer):

    def identify(self, request, context):
        return capture_pb2.CaptureIdentifyResponse(0.5)