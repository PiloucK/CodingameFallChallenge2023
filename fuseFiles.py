import os

def aggregate_typescript_files(source_dir, output_file, ignore_dirs=None):
    if ignore_dirs is None:
        ignore_dirs = []

    all_files_content = ""
    import_seen = False  # Used to track multiline imports

    for root, dirs, files in os.walk(source_dir):
        # Skip ignored directories
        if any(ignored in root for ignored in ignore_dirs):
            continue

        for file in files:
            if file.endswith(".ts"):
                with open(os.path.join(root, file), 'r') as f:
                    lines = f.readlines()
                
                for line in lines:
                    line_strip = line.strip()
                    if line_strip.startswith('import'):
                        if not line_strip.endswith(';'):
                            import_seen = True  # Set flag for multiline import
                        continue  # Skip adding this line regardless of its type

                    if import_seen and line_strip.endswith(';'):
                        import_seen = False  # Reset the flag at the end of a multiline import
                        continue  # Also skip adding the ending line of a multiline import

                    if not import_seen:
                        all_files_content += line  # Add line if it's not part of an import statement

    all_files_content += "\nconst game = new Game();while (true) {game.playTurn();}\n"

    with open(output_file, 'w') as f:
        f.write(all_files_content)

# Usage
source_directory = './src/Game'
output_filename = 'submissionFile.ts'
ignored_folders = []
aggregate_typescript_files(source_directory, output_filename, ignored_folders)
