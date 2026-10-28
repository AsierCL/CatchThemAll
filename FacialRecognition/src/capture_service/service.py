from .generated import capture_pb2_grpc, capture_pb2
import cv2
import numpy as np


def bytes_to_image(image_bytes):
    image_array = np.frombuffer(image_bytes, dtype=np.uint8)
    image = cv2.imdecode(image_array, cv2.IMREAD_COLOR)

    if image is None:
        context.abort(
            grpc.StatusCode.INVALID_ARGUMENT,
            "La imagen no se pudo decodificar"
        )

    return image


class CaptureService(capture_pb2_grpc.CaptureServiceServicer):

    def __init__(self, app, cursor):
        self.app = app
        self.cursor = cursor

    def get_embeddings(self, image, context):
        if image is None:
            context.abort(
                grpc.StatusCode.FAILED_PRECONDITION,
                "La imagen es un campo obligatorio"
            )

        faces = self.app.get(image)

        if not faces:
            context.abort(
                grpc.StatusCode.FAILED_PRECONDITION,
                "No hay caras en la foto"
            )

        return [face.normed_embedding for face in faces]

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
            image = bytes_to_image(request.image, context)
            embeddings = self.get_embeddings(image, context)
            originals = self.find_embedding(request.name)

            if not originals:
                context.abort(
                    grpc.StatusCode.NOT_FOUND,
                    "No existen embeddings para este famoso"
                )

            best_similarity = max(
                self.compare_embedding(embedding, original)
                for embedding in embeddings
                for original in originals
            )

            if best_similarity <= 0.7:
                context.abort(
                    grpc.StatusCode.NOT_FOUND,
                    "No se ha encontrado coincidencia con este famoso"
                )

            return capture_pb2.CaptureIdentifyResponse(
                similarity=best_similarity
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

        rows = self.cursor.fetchall()

        if rows is None:
            return None

        return [row[0] for row in rows]

    def compare_embedding(self, embedding, original):
        a = np.asarray(embedding, dtype=np.float32)
        b = np.asarray(original.to_list(), dtype=np.float32)

        denominator = np.linalg.norm(a) * np.linalg.norm(b)

        if denominator == 0:
            return 0.0

        similarity = float(np.dot(a, b) / denominator)
        return similarity