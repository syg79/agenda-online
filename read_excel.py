import pandas as pd
import sys
import json

try:
    file_path = r"d:\PROJETO\Agenda online\_matriz modelo\Solicitacoes.xlsx"
    df = pd.read_excel(file_path, sheet_name=0)
    print("Columns in Excel:")
    print(df.columns.tolist())
    print("\nFirst 5 rows:")
    print(df.head(5).to_json(orient='records', force_ascii=False))
except Exception as e:
    print(f"Error: {e}")
