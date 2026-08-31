import os
import re
from typing import List, Set, Dict, Tuple
from collections import Counter
import pandas as pd
import nltk

# Configure local NLTK data directory located inside the backend workspace
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
LOCAL_NLTK_DIR = os.path.join(CURRENT_DIR, "nltk_data")
if os.path.exists(LOCAL_NLTK_DIR) and LOCAL_NLTK_DIR not in nltk.data.path:
    nltk.data.path.insert(0, LOCAL_NLTK_DIR)

from nltk.corpus import wordnet, stopwords
from nltk.stem import WordNetLemmatizer
from nltk.tokenize import RegexpTokenizer

class NLPService:
    def __init__(self, dataset_symptoms: List[str], df_norm: pd.DataFrame):
        self.dataset_symptoms = dataset_symptoms
        self.df_norm = df_norm
        self.lemmatizer = WordNetLemmatizer()
        self.tokenizer = RegexpTokenizer(r'\w+')
        try:
            self.stop_words = set(stopwords.words('english'))
        except Exception:
            self.stop_words = {'i', 'me', 'my', 'myself', 'we', 'our', 'you', 'your', 'he', 'she', 'it', 'they', 'a', 'an', 'the', 'and', 'but', 'if', 'or', 'because', 'as', 'until', 'while', 'of', 'at', 'by', 'for', 'with', 'about', 'against', 'between', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'to', 'from', 'up', 'down', 'in', 'out', 'on', 'off', 'over', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 's', 't', 'can', 'will', 'just', 'don', 'should', 'now'}
        
        # Precompute lemmatized tokens for each dataset symptom
        self.symptom_tokens_map: Dict[str, Set[str]] = {}
        for sym in self.dataset_symptoms:
            tokens = set(self._clean_and_lemmatize(sym))
            self.symptom_tokens_map[sym] = tokens

    def _clean_and_lemmatize(self, text: str) -> List[str]:
        text = text.lower().replace('-', ' ').replace("'", "")
        words = self.tokenizer.tokenize(text)
        cleaned = []
        for word in words:
            if word not in self.stop_words and not word.isdigit():
                try:
                    cleaned.append(self.lemmatizer.lemmatize(word))
                except Exception:
                    cleaned.append(word)
        return cleaned

    def get_synonyms(self, word: str) -> Set[str]:
        synonyms = set()
        synonyms.add(word)
        try:
            for syn in wordnet.synsets(word):
                for lemma in syn.lemmas():
                    name = lemma.name().lower().replace('_', ' ')
                    synonyms.add(name)
        except Exception:
            pass
        return synonyms

    def match_symptoms_from_text(self, text: str) -> List[str]:
        if not text or not text.strip():
            return []

        # Split multiple symptoms by commas, semicolons, or conjunctions
        raw_phrases = re.split(r'[,;\n\.\&]|\band\b|\balso\b|\bwith\b', text, flags=re.IGNORECASE)
        user_queries = [p.strip() for p in raw_phrases if p.strip()]

        matched_symptoms: Set[str] = set()

        for query in user_queries:
            query_tokens = self._clean_and_lemmatize(query)
            if not query_tokens:
                continue

            # Expand query tokens with synonyms
            expanded_tokens = set(query_tokens)
            for token in query_tokens:
                expanded_tokens.update(self.get_synonyms(token))

            query_text_normalized = ' '.join(query_tokens)

            for sym, sym_tokens in self.symptom_tokens_map.items():
                if not sym_tokens:
                    continue

                # 1. Exact or substring match
                if sym in query.lower() or query_text_normalized in sym:
                    matched_symptoms.add(sym)
                    continue

                # 2. Token overlap & Jaccard similarity
                intersection = sym_tokens.intersection(expanded_tokens)
                if intersection:
                    score = len(intersection) / len(sym_tokens)
                    if score >= 0.5 or (len(sym_tokens) == 1 and len(intersection) == 1):
                        matched_symptoms.add(sym)

        # Also search entire text directly if nothing found from phrases
        if not matched_symptoms:
            full_tokens = set(self._clean_and_lemmatize(text))
            for sym, sym_tokens in self.symptom_tokens_map.items():
                if sym_tokens and sym_tokens.issubset(full_tokens):
                    matched_symptoms.add(sym)

        return sorted(list(matched_symptoms))

    def suggest_co_occurring_symptoms(self, selected_symptoms: List[str], limit: int = 12) -> Tuple[List[Dict[str, any]], int]:
        if not selected_symptoms:
            # Return most common symptoms overall
            symptom_counts = {}
            for sym in self.dataset_symptoms:
                if sym in self.df_norm.columns:
                    symptom_counts[sym] = int(self.df_norm[sym].sum())
            sorted_syms = sorted(symptom_counts.items(), key=lambda x: x[1], reverse=True)[:limit]
            suggestions = [
                {"symptom": s[0], "co_occurrence_count": s[1], "relevance_score": round(s[1] / len(self.df_norm), 3)}
                for s in sorted_syms
            ]
            return suggestions, len(self.df_norm)

        # Find all diseases that have at least one of the selected symptoms
        selected_set = set(selected_symptoms)
        dis_list = set()
        for sym in selected_symptoms:
            if sym in self.df_norm.columns:
                diseases_with_sym = self.df_norm[self.df_norm[sym] == 1]['label_dis'].tolist()
                dis_list.update(diseases_with_sym)

        counter_list = []
        for dis in dis_list:
            row = self.df_norm[self.df_norm['label_dis'] == dis]
            if row.empty:
                continue
            row_vals = row.iloc[0]
            for sym in self.dataset_symptoms:
                if sym not in selected_set and sym in row_vals and row_vals[sym] == 1:
                    counter_list.append(sym)

        counts = Counter(counter_list)
        total_assoc_diseases = len(dis_list) or 1
        
        suggestions = []
        for sym, count in counts.most_common(limit):
            relevance = round(count / total_assoc_diseases, 3)
            suggestions.append({
                "symptom": sym,
                "co_occurrence_count": count,
                "relevance_score": relevance
            })

        return suggestions, len(dis_list)
