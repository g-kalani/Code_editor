import os
import json
from datasets import load_dataset

# 1. STOP THE WINDOWS SYMLINK WARNING
os.environ["HF_HUB_DISABLE_SYMLINKS_WARNING"] = "1"

def prepare_data():
    print("Starting dataset acquisition...")
    
    # 2. FETCH MBPP (PYTHON)
    # Using 'google-research-datasets/mbpp' - standard Parquet version
    print("Downloading MBPP (Python)...")
    try:
        # We use 'sanitized' to get the highest quality error/fix pairs
        mbpp = load_dataset("google-research-datasets/mbpp", "sanitized", split="test")
        python_data = [
            {
                "error_context": d["prompt"], 
                "fix": d["code"], 
                "lang": "python"
            } 
            for d in mbpp
        ]
        print(f"Successfully loaded {len(python_data)} Python examples.")
    except Exception as e:
        print(f"Failed to load MBPP: {e}")
        python_data = []

    # 3. FETCH CODESEARCHNET (C++)
    # Using the community Parquet version to bypass script errors
    print("Downloading CodeSearchNet C++...")
    try:
        csn_cpp = load_dataset("code-search-net/code_search_net", "cpp", split="train", trust_remote_code=True)
        cpp_data = [
            {
                "error_context": d["func_documentation_string"], 
                "fix": d["func_code_string"], 
                "lang": "cpp"
            } 
            for d in csn_cpp.select(range(300))
        ]
        print(f"Successfully loaded {len(cpp_data)} C++ examples.")
    except Exception as e:
        print(f"Failed to load C++ data: {e}")
        cpp_data = []

    # 4. FETCH CODESEARCHNET (JAVA)
    print("Downloading CodeSearchNet Java...")
    try:
        csn_java = load_dataset("code_search_net/code_search_net", "java", split="train", trust_remote_code=True)
        java_data = [
            {
                "error_context": d["func_documentation_string"], 
                "fix": d["func_code_string"], 
                "lang": "java"
            } 
            for d in csn_java.select(range(300))
        ]
        print(f"Successfully loaded {len(java_data)} Java examples.")
    except Exception as e:
        print(f"Failed to load Java data: {e}")
        java_data = []

    # 5. COMBINE AND SAVE
    final_dataset = python_data + cpp_data + java_data
    
    # Save to the root project folder
    output_path = os.path.join(os.path.dirname(os.getcwd()), "dataset.json")
    
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(final_dataset, f, indent=4, ensure_ascii=False)
    
    print(f"\n--- SUCCESS ---")
    print(f"Total examples saved: {len(final_dataset)}")
    print(f"File location: {output_path}")

if __name__ == "__main__":
    prepare_data()