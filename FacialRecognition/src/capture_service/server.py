from .generated import capture_pb2_grpc
from .service import CaptureService
import grpc
import psycopg2
from pgvector.psycopg2 import register_vector
from insightface.app import FaceAnalysis
from concurrent import futures
import os
from dotenv import load_dotenv

MAX_MESSAGE_SIZE = 10 * 1024 * 1024

load_dotenv()

def server():
    app = FaceAnalysis(
            name="buffalo_l",
            providers=["CPUExecutionProvider"]
        )
    app.prepare(ctx_id=-1, det_size=(640, 640))
    conexion = psycopg2.connect(
        host=os.getenv("SUPABASE_DB_HOST"),
        port=os.getenv("SUPABASE_DB_PORT"),
        dbname=os.getenv("SUPABASE_DB_NAME"),
        user=os.getenv("SUPABASE_DB_USER"),
        password=os.getenv("SUPABASE_DB_PASSWORD"),
        sslmode="require",
        connect_timeout=5
    )
    conexion.autocommit = True
    cursor = conexion.cursor()

    # La extension tiene que existir antes de registrar el tipo `vector` en
    # psycopg2; si no, register_vector falla con "vector type not found".
    cursor.execute("CREATE EXTENSION IF NOT EXISTS vector")
    register_vector(conexion)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS face_embeddings (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            embedding VECTOR(512)
        )
    """)
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS face_embeddings_name_idx
        ON face_embeddings (name)
    """)

    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10),
                         options=[
                             ("grpc.max_receive_message_length", MAX_MESSAGE_SIZE),
                         ])
    capture_pb2_grpc.add_CaptureServiceServicer_to_server(
        CaptureService(app,cursor),
        server,
    )
    listen_addr = "[::]:9090"
    server.add_insecure_port(listen_addr)
    print(f"Starting server on {listen_addr}", flush=True)
    server.start()
    server.wait_for_termination()
    cursor.close()
    conexion.close()

if __name__ == "__main__":
    server()