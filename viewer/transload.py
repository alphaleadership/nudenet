import os
import subprocess

def convert_mp4_to_gif(input_folder, output_folder):
    for filename in os.listdir(input_folder):
        if filename.endswith(".mp4"):
            input_path = os.path.join(input_folder, filename)
            output_path = os.path.join(output_folder, filename.replace(".mp4", ".gif"))
            # Vérification de la taille du fichier
            file_size = os.path.getsize(input_path)
            if file_size > 100000000:  # taille maximale en octets (100 Mo)
                # Split du fichier
                chunk_size = 10000000  # taille des chunks en octets (10 Mo)
                chunk_count = 0
                with open(input_path, 'rb') as file:
                    while True:
                        chunk = file.read(chunk_size)
                        if not chunk:
                            break
                        chunk_path = f"{output_path}.part{chunk_count}"
                        with open(chunk_path, 'wb') as chunk_file:
                            chunk_file.write(chunk)
                        chunk_count += 1
                # Conversion des chunks
                for i in range(chunk_count):
                    chunk_path = f"{output_path}.part{i}"
                    command = f"ffmpeg -i {chunk_path} -vf scale=320:-1 {output_path}.part{i}.gif"
                    subprocess.run(command, shell=True)
                    print(f"La conversion de {chunk_path} en {output_path}.part{i}.gif a réussi.")
                # Suppression des chunks
                for i in range(chunk_count):
                    chunk_path = f"{output_path}.part{i}"
                    os.remove(chunk_path)
                # Suppression du fichier original
                os.remove(input_path)
            else:
                command = f"ffmpeg -i {input_path} -vf scale=320:-1 {output_path}"
                subprocess.run(command, shell=True)
                print(f"La conversion de {input_path} en {output_path} a réussi.")
                # Suppression du fichier original
                os.remove(input_path)

input_folder = 'video'
output_folder = 'media'

convert_mp4_to_gif(input_folder, output_folder)

