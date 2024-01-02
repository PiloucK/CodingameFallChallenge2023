import os

def aggregate_typescript_files(source_dir, output_file, ignore_dirs=None):
    if ignore_dirs is None:
        ignore_dirs = []

    all_files_content = ""

    for root, dirs, files in os.walk(source_dir):
        # Skip ignored directories
        if any(ignored in root for ignored in ignore_dirs):
            continue

        for file in files:
            if file.endswith(".ts"):
                with open(os.path.join(root, file), 'r') as f:
                    lines = f.readlines()
                
                # Filter out import statements
                lines = [line for line in lines if not line.strip().startswith('import')]
                all_files_content += ''.join(lines)


    all_files_content += "\nconst game = new Game();while (true) {game.playTurn();}\n"

    with open(output_file, 'w') as f:
        f.write(all_files_content)

# Usage
source_directory = './src/Game'
output_filename = 'submissionFile.ts'
ignored_folders = []
aggregate_typescript_files(source_directory, output_filename, ignored_folders)
