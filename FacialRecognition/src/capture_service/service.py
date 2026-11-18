from .generated import capture_pb2_grpc, capture_pb2
import cv2
import grpc
import numpy as np
import threading


def bytes_to_image(image_bytes, context):
    if not image_bytes:
        context.abort(grpc.StatusCode.INVALID_ARGUMENT, "La imagen es un campo obligatorio")

    image_array = np.frombuffer(image_bytes, dtype=np.uint8)
    image = cv2.imdecode(image_array, cv2.IMREAD_COLOR)

    if image is None:
        context.abort(
            grpc.StatusCode.INVALID_ARGUMENT,
            "La imagen no se pudo decodificar"
        )

    return image


def embedding_to_list(value):
    """pgvector puede devolver `Vector` o `numpy.ndarray` según la versión."""
    if hasattr(value, "to_list"):
        return value.to_list()
    if isinstance(value, np.ndarray):
        return value.tolist()
    return list(value)


class CaptureService(capture_pb2_grpc.CaptureServiceServicer):

    def __init__(self, app, cursor):
        self.app = app
        self.cursor = cursor
        # psycopg2 no permite compartir un cursor entre los hilos del servidor.
        self.db_lock = threading.Lock()

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
        name = (request.name or "").strip()
        if not name:
            context.abort(
                grpc.StatusCode.INVALID_ARGUMENT,
                "El nombre del famoso es obligatorio"
            )

        image = bytes_to_image(request.image, context)
        faces = self.app.get(image)

        if not faces:
            context.abort(
                grpc.StatusCode.FAILED_PRECONDITION,
                "No hay caras en la foto"
            )

        if len(faces) != 1:
            context.abort(
                grpc.StatusCode.FAILED_PRECONDITION,
                "La foto de referencia debe tener una sola cara"
            )

        embedding = faces[0].normed_embedding

        try:
            with self.db_lock:
                self.cursor.execute(
                    """
                    INSERT INTO face_embeddings (name, embedding)
                    VALUES (%s, %s)
                    """,
                    (name, embedding)
                )
        except Exception as e:
            context.abort(
                grpc.StatusCode.INTERNAL,
                f"No se pudo guardar el embedding: {e}"
            )

        return capture_pb2.CaptureCreationResponse(
            response="Creation successful"
        )

    def identify(self, request, context):
        name = (request.name or "").strip()
        if not name:
            context.abort(
                grpc.StatusCode.INVALID_ARGUMENT,
                "El nombre del famoso es obligatorio"
            )

        image = bytes_to_image(request.image, context)
        embeddings = self.get_embeddings(image, context)
        originals = self.find_embedding(name)

        if not originals:
            context.abort(
                grpc.StatusCode.NOT_FOUND,
                "No existen embeddings para este famoso"
            )

        best_similarity = -1.0
        best_embedding = None
        for embedding in embeddings:
            for original in originals:
                similarity = self.compare_embedding(embedding, original)
                if similarity > best_similarity:
                    best_similarity = similarity
                    best_embedding = embedding

        if best_similarity <= 0.7:
            context.abort(
                grpc.StatusCode.NOT_FOUND,
                "No se ha encontrado coincidencia con este famoso"
            )

        # Si la coincidencia es muy alta, se agrega la foto como nueva muestra.
        if best_similarity >= 0.85 and best_embedding is not None:
            try:
                with self.db_lock:
                    self.cursor.execute(
                        """
                        INSERT INTO face_embeddings(name, embedding)
                        VALUES (%s, %s)
                        """,
                        (name, best_embedding)
                    )
            except Exception:
                # No se pierde la captura si falla el guardado de la muestra.
                pass

        return capture_pb2.CaptureIdentifyResponse(
            similarity=best_similarity
        )

    def find_embedding(self, name):
        with self.db_lock:
            self.cursor.execute(
                """
                SELECT embedding
                FROM face_embeddings
                WHERE name = %s
                """,
                (name,)
            )
            rows = self.cursor.fetchall()

        if not rows:
            return None

        return [row[0] for row in rows]

    def compare_embedding(self, embedding, original):
        a = np.asarray(embedding, dtype=np.float32).ravel()
        b = np.asarray(embedding_to_list(original), dtype=np.float32).ravel()

        if a.shape != b.shape:
            return 0.0

        denominator = np.linalg.norm(a) * np.linalg.norm(b)

        if denominator == 0:
            return 0.0

        similarity = float(np.dot(a, b) / denominator)
        return similarity
