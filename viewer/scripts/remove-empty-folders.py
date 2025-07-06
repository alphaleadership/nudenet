import os
import sys

def is_empty(directory):
    """Check if a directory is empty."""
    try:
        return not os.listdir(directory)
    except OSError:
        return False

def remove_empty_folders(directory):
    """
    Recursively remove empty folders from the specified directory.
    """
    # Walk through the directory tree in reverse order
    for root, dirs, files in os.walk(directory, topdown=False):
        for dir_name in dirs:
            dir_path = os.path.join(root, dir_name)
            if is_empty(dir_path):
                print(f"Removing empty folder: {dir_path}")
                try:
                    os.rmdir(dir_path)
                except OSError as e:
                    print(f"Error removing {dir_path}: {e}")

if __name__ == "__main__":
    # Default to the 'good' directory in the current working directory
    target_dir = os.path.join(os.getcwd(), 'good')
    
    # If a command line argument is provided, use that as the target directory
    if len(sys.argv) > 1:
        target_dir = sys.argv[1]
    
    print(f"Searching for empty folders in: {target_dir}")
    remove_empty_folders(target_dir)
    print("\nFinished removing empty folders")
