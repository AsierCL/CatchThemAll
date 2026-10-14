from .generated import capture_pb2_grpc, capture_pb2
import cv2
import numpy as np


def bytes_to_image(image_bytes):
    image_array = np.frombuffer(image_bytes, dtype=np.uint8)
    image = cv2.imdecode(image_array, cv2.IMREAD_COLOR)

    if image is None:
        raise ValueError("No se pudo decodificar la imagen")

    return image


class CaptureService(capture_pb2_grpc.CaptureServiceServicer):

    def __init__(self, app, cursor):
        self.app = app
        self.cursor = cursor

    def get_embedding(self, image):

        if image is None:
            raise ValueError("No se pudo decodificar la imagen")

        faces = self.app.get(image)

        if not faces:
            raise ValueError("No se ha detectado ninguna cara")

        if len(faces) > 1:
            raise ValueError("Se han detectado varias caras")

        return faces[0].normed_embedding

    def create(self, request, context):
        try:
            image = bytes_to_image(request.image)
            embedding = self.get_embedding(image)

            self.cursor.execute(
                """
                INSERT INTO face_embeddings (name, embedding)
                VALUES (%s, %s)
                """,
                (request.name, embedding)
            )

            return capture_pb2.CaptureCreationResponse(
                response="Creation successful"
            )

        except Exception as e:
            context.set_code(
                __import__("grpc").StatusCode.INVALID_ARGUMENT
            )
            context.set_details(str(e))
            raise

    def identify(self, request, context):
        try:
            image = bytes_to_image(request.image)
            embedding = self.get_embedding(image)
            original = self.find_embedding(request.name)

            if original is None:
                context.set_code(__import__("grpc").StatusCode.NOT_FOUND)
                context.set_details("No existe un famoso con ese nombre")
                raise ValueError("No existe un famoso con ese nombre")

            similarity = self.compare_embedding(embedding, original)

            return capture_pb2.CaptureIdentifyResponse(
                similarity=similarity
            )

        except Exception as e:
            if context.code() is None:
                context.set_code(
                    __import__("grpc").StatusCode.INVALID_ARGUMENT
                )
                context.set_details(str(e))
            raise

    def find_embedding(self, name):
        self.cursor.execute(
            """
            SELECT embedding
            FROM face_embeddings
            WHERE name = %s
            """,
            (name,)
        )

        row = self.cursor.fetchone()

        if row is None:
            return None

        return row[0]

    def compare_embedding(self, embedding, original):
        a = np.asarray(embedding, dtype=np.float32)
        b = np.asarray(original.to_list(), dtype=np.float32)

        denominator = np.linalg.norm(a) * np.linalg.norm(b)

        if denominator == 0:
            return 0.0

        similarity = float(np.dot(a, b) / denominator)
        return similarity