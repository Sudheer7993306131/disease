import os
import sys

# Add backend directory to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import db
from remedies_service import RemediesService
from ml_service import MLService

def assign_specialty(disease_name: str) -> str:
    name = disease_name.lower()
    if any(k in name for k in ['brain', 'neuro', 'stroke', 'paralysis', 'migraine', 'headache']):
        return "Neurologist"
    if any(k in name for k in ['heart', 'cardio', 'myocardial', 'angina']):
        return "Cardiologist"
    if any(k in name for k in ['skin', 'acne', 'rash', 'psoriasis', 'fungal', 'melanoma', 'eczema']):
        return "Dermatologist"
    if any(k in name for k in ['eye', 'vision', 'cataract', 'glaucoma']):
        return "Ophthalmologist"
    if any(k in name for k in ['bone', 'joint', 'arthritis', 'osteo', 'fracture', 'spine']):
        return "Orthopedic"
    if any(k in name for k in ['lung', 'asthma', 'bronchitis', 'respiratory', 'pneumonia', 'tb', 'tuberculosis']):
        return "Pulmonologist"
    if any(k in name for k in ['stomach', 'gastric', 'ulcer', 'bowel', 'liver', 'hepatitis', 'jaundice', 'digestive', 'gerd']):
        return "Gastroenterologist"
    if any(k in name for k in ['kidney', 'renal', 'urinary']):
        return "Nephrologist"
    if any(k in name for k in ['sugar', 'diabetes', 'thyroid', 'hormone', 'endocrine']):
        return "Endocrinologist"
    if any(k in name for k in ['woman', 'pregnancy', 'cervical', 'ovarian', 'uterus', 'gyno', 'pcos']):
        return "Gynecologist"
    if any(k in name for k in ['child', 'pediatric']):
        return "Pediatrician"
    if any(k in name for k in ['mental', 'depression', 'anxiety', 'schizophrenia', 'bipolar']):
        return "Psychiatrist"
    if any(k in name for k in ['tooth', 'dental', 'gum']):
        return "Dentist"
    if any(k in name for k in ['cancer', 'tumor', 'leukemia']):
        return "Oncologist"
    if any(k in name for k in ['blood', 'anemia']):
        return "Hematologist"
    if any(k in name for k in ['ear', 'nose', 'throat', 'sinus']):
        return "ENT Specialist"
    if any(k in name for k in ['allergy', 'allergic']):
        return "Allergist"
    
    return "General Physician"

if __name__ == "__main__":
    print("Loading dataset...")
    CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
    DATASET_DIR = os.path.join(CURRENT_DIR, "dataset")
    remedies_service = RemediesService(DATASET_DIR)
    ml_service = MLService(DATASET_DIR, remedies_service)
    
    diseases = ml_service.diseases
    print(f"Found {len(diseases)} diseases. Assigning specialties...")
    
    mappings = []
    for disease in diseases:
        specialty = assign_specialty(disease)
        mappings.append({
            "disease_name": disease,
            "specialization_name": specialty
        })
    
    # Drop existing mappings to avoid duplicates
    print("Dropping old mappings...")
    db.disease_specialty_mapping.drop()
    
    # Insert new mappings
    print("Inserting new mappings to MongoDB...")
    db.disease_specialty_mapping.insert_many(mappings)
    
    print(f"Successfully mapped {len(mappings)} diseases to specialties in MongoDB!")
