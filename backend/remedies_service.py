import os
import openpyxl
from typing import Dict, List, Optional

class RemediesService:
    def __init__(self, dataset_dir: str):
        self.excel_path = os.path.join(dataset_dir, "cure_minor.xlsx")
        self.remedies_map: Dict[str, List[str]] = {}
        self._load_remedies()

    def _load_remedies(self):
        if not os.path.exists(self.excel_path):
            print(f"Warning: Cure dataset file not found at {self.excel_path}")
            return

        try:
            wb = openpyxl.load_workbook(self.excel_path, data_only=True)
            sheet = wb.active
            for row in sheet.iter_rows(values_only=True):
                if not row or not row[0]:
                    continue
                disease_name = str(row[0]).strip()
                remedy_text = ""
                # Join remaining columns if multiple
                for cell in row[1:]:
                    if cell is not None:
                        remedy_text += " " + str(cell)
                
                remedy_text = remedy_text.strip()
                # Split remedies by comma or semicolon
                remedies_list = [
                    r.strip().capitalize() 
                    for r in remedy_text.replace(";", ",").split(",") 
                    if r.strip() and len(r.strip()) > 1
                ]
                
                if not remedies_list:
                    remedies_list = ["Consult a healthcare specialist for diagnosis and personalized treatment plan."]
                
                self.remedies_map[disease_name.lower()] = remedies_list
                # also keep original case
                self.remedies_map[disease_name] = remedies_list

            print(f"Successfully loaded remedies for {len(self.remedies_map)//2} diseases.")
        except Exception as e:
            print(f"Error loading remedies from Excel: {e}")

    def get_remedies_for_disease(self, disease_name: str) -> List[str]:
        # Try direct match, then lowercase match
        if disease_name in self.remedies_map:
            return self.remedies_map[disease_name]
        
        lower_name = disease_name.lower().strip()
        if lower_name in self.remedies_map:
            return self.remedies_map[lower_name]
        
        # Fuzzy / partial match
        for k, v in self.remedies_map.items():
            if lower_name in k.lower() or k.lower() in lower_name:
                return v
        
        return [
            "Maintain proper hydration and adequate rest.",
            "Monitor symptoms closely and avoid strenuous activities.",
            "Consult a licensed physician if symptoms persist or worsen."
        ]

    def get_all_remedies(self) -> Dict[str, List[str]]:
        return self.remedies_map
