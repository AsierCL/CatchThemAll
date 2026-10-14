
import cv2
import numpy as np
from insightface.app import FaceAnalysis

# Cargar el modelo preentrenado.
# La primera ejecución puede descargar los modelos necesarios.
app = FaceAnalysis(
    name="buffalo_l",
    providers=["CPUExecutionProvider"]
)
app.prepare(ctx_id=-1, det_size=(640, 640))


def get_embedding(image_path):
    image = cv2.imread(image_path)

    if image is None:
        raise ValueError(f"No se pudo leer la imagen: {image_path}")

    faces = app.get(image)

    if not faces:
        raise ValueError("No se ha detectado ninguna cara")

    if len(faces) > 1:
        raise ValueError("Se han detectado varias caras")

    # Embedding facial de 512 dimensiones.
    embedding = faces[0].normed_embedding

    return embedding


embedding = get_embedding("image.jpg")

print("Dimensiones:", embedding.shape)
print("Embedding:", embedding)
