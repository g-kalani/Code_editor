import pandas as pd
import json
import os
import numpy as np

def final_reconstructor(output_file="dataset.jsonl", limit=500):
    files = {
        'python': 'python_data.parquet',
        'java': 'java_data.parquet',
        'cpp': 'cpp_data.parquet'
    }
    
    print("--- Reconstructing Code from Tokens (Final Fix) ---")

    with open(output_file, "w", encoding="utf-8") as f_out:
        for lang, filename in files.items():
            if not os.path.exists(filename):
                continue
            
            print(f" Processing {lang}...")
            try:
                df = pd.read_parquet(filename)
                
                count = 0
                for _, row in df.head(limit).iterrows():
                    # 1. Safely get data without triggering truth evaluation
                    code_data = row.get('pl_tokens')
                    if code_data is None:
                        code_data = row.get('code')
                    if code_data is None:
                        code_data = row.get('whole_func_code')
                    
                    # 2. Check type safely
                    if isinstance(code_data, (list, np.ndarray)):
                        code_content = " ".join(map(str, code_data))
                    else:
                        code_content = str(code_data) if code_data is not None else ""
                    
                    # 3. Handle comment tokens safely
                    comment_data = row.get('nl_tokens')
                    if comment_data is None:
                        comment_data = row.get('docstring')
                    if comment_data is None:
                        comment_data = row.get('func_documentation_string')

                    if isinstance(comment_data, (list, np.ndarray)):
                        comment_content = " ".join(map(str, comment_data))
                    else:
                        comment_content = str(comment_data) if comment_data is not None else ""

                    if code_content.strip():
                        record = {"lang": lang, "code": code_content, "comment": comment_content}
                        f_out.write(json.dumps(record) + "\n")
                        count += 1
                
                print(f"  - Successfully added {count} samples for {lang}")
            except Exception as e:
                print(f"  - Error in {lang}: {e}")

    print(f"\nDone! Your dataset is ready in {output_file}")

if __name__ == "__main__":
    final_reconstructor()