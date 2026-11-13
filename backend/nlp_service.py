import os
import re
from typing import List, Set, Dict, Tuple, Any
from collections import Counter
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
    def __init__(self, dataset_symptoms: List[str], df_norm: Any):
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

        # Precompute normalized co-occurrence lookups (works with DataFrame or list of dicts)
        self._build_norm_index(df_norm)

    def _build_norm_index(self, df_norm: Any) -> None:
        self.total_diseases = 0
        self.symptom_counts: Dict[str, int] = {sym: 0 for sym in self.dataset_symptoms}
        self.symptom_to_diseases: Dict[str, Set[str]] = {sym: set() for sym in self.dataset_symptoms}
        self.disease_to_symptoms: Dict[str, List[str]] = {}

        if df_norm is None:
            return

        if hasattr(df_norm, "iterrows"):
            rows_iter = (row for _, row in df_norm.iterrows())
            total = len(df_norm)
        else:
            rows_iter = iter(df_norm)
            total = len(df_norm)

        self.total_diseases = total
        for row in rows_iter:
            dis = row["label_dis"]
            active_syms: List[str] = []
            for sym in self.dataset_symptoms:
                val = row.get(sym, 0) if isinstance(row, dict) else (row[sym] if sym in row else 0)
                if val == 1:
                    active_syms.append(sym)
                    self.symptom_counts[sym] += 1
                    self.symptom_to_diseases[sym].add(dis)
            if dis not in self.disease_to_symptoms:
                self.disease_to_symptoms[dis] = active_syms

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

    def suggest_co_occurring_symptoms(self, selected_symptoms: List[str], limit: int = 12) -> Tuple[List[Dict[str, Any]], int]:
        if not selected_symptoms:
            # Return most common symptoms overall
            sorted_syms = sorted(self.symptom_counts.items(), key=lambda x: x[1], reverse=True)[:limit]
            total = self.total_diseases or 1
            suggestions = [
                {"symptom": s[0], "co_occurrence_count": s[1], "relevance_score": round(s[1] / total, 3)}
                for s in sorted_syms
            ]
            return suggestions, self.total_diseases

        # Find all diseases that have at least one of the selected symptoms
        selected_set = set(selected_symptoms)
        dis_list: Set[str] = set()
        for sym in selected_symptoms:
            if sym in self.symptom_to_diseases:
                dis_list.update(self.symptom_to_diseases[sym])

        counter_list = []
        for dis in dis_list:
            for sym in self.disease_to_symptoms.get(dis, []):
                if sym not in selected_set:
                    counter_list.append(sym)

        counts = Counter(counter_list)
        total_assoc_diseases = len(dis_list) or 1

        suggestions = [
            {
                "symptom": sym,
                "co_occurrence_count": count,
                "relevance_score": round(count / total_assoc_diseases, 3)
            }
            for sym, count in counts.most_common(limit)
        ]

        return suggestions, len(dis_list)
