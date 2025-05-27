import pandas as pd
import numpy as np
import nltk
from nltk.tokenize import word_tokenize
from nltk.corpus import stopwords
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.model_selection import train_test_split
from sklearn.naive_bayes import MultinomialNB
from sklearn.svm import SVC
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
from keras.models import Sequential
from keras.layers import Dense, Embedding, LSTM, Conv1D, MaxPooling1D, Flatten
from keras.preprocessing.sequence import pad_sequences
from keras.preprocessing.text import Tokenizer

# Load data
df = pd.read_csv('data.csv')

# Pre-processing
nltk.download('punkt')
nltk.download('stopwords')
stop_words = set(stopwords.words('english'))

def pre_process(text):
    tokens = word_tokenize(text)
    tokens = [t for t in tokens if t.isalpha()]
    tokens = [t for t in tokens if t not in stop_words]
    return ' '.join(tokens)

df['text'] = df['text'].apply(pre_process)

# Feature extraction
vectorizer = TfidfVectorizer()
X = vectorizer.fit_transform(df['text'])
y = df['label']

# Split the data
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Model ensemble for traditional classifiers
def model_ensemble(X_train, y_train, X_test, y_test):
    models = [
        MultinomialNB(),
        SVC(),
        RandomForestClassifier()
    ]

    for model in models:
        model.fit(X_train, y_train)
        y_pred = model.predict(X_test)
        print(f"{model.__class__.__name__} - Accuracy: {accuracy_score(y_test, y_pred):.4f}, "
              f"Precision: {precision_score(y_test, y_pred, average='weighted'):.4f}, "
              f"Recall: {recall_score(y_test, y_pred, average='weighted'):.4f}, "
              f"F1: {f1_score(y_test, y_pred, average='weighted'):.4f}")

# Call model ensemble for traditional classifiers
model_ensemble(X_train, y_train, X_test, y_test)

# Prepare data for CNN and LSTM
tokenizer = Tokenizer()
tokenizer.fit_on_texts(df['text'])
X_seq = tokenizer.texts_to_sequences(df['text'])
X_pad = pad_sequences(X_seq, maxlen=200)

# Split padded sequences
X_train_seq, X_test_seq, y_train_seq, y_test_seq = train_test_split(X_pad, y, test_size=0.2, random_state=42)

# CNN model
def create_cnn_model(input_shape):
    model = Sequential()
    model.add(Embedding(input_dim=len(tokenizer.word_index) + 1, output_dim=128, input_length=input_shape[1]))
    model.add(Conv1D(128, 5, activation='relu'))
    model.add(MaxPooling1D(pool_size=2))
    model.add(Flatten())
    model.add(Dense(1, activation='sigmoid'))
    model.compile(optimizer='adam', loss='binary_crossentropy', metrics=['accuracy'])
    return model

cnn_model = create_cnn_model(X_train_seq.shape)
cnn_model.fit(X_train_seq, y_train_seq, epochs=5, batch_size=32)

# LSTM model
def create_lstm_model(input_shape):
    model = Sequential()
    model.add(Embedding(input_dim=len(tokenizer.word_index) + 1, output_dim=128, input_length=input_shape[1]))
    model.add(LSTM(128))
    model.add(Dense(1, activation='sigmoid'))
    model.compile(optimizer='adam', loss='binary_crossentropy', metrics=['accuracy'])
    return model

lstm_model = create_lstm_model(X_train_seq.shape)
lstm_model.fit(X_train_seq, y_train_seq, epochs=5, batch_size=32)

# Evaluate CNN model
cnn_loss, cnn_accuracy = cnn_model.evaluate(X_test_seq, y_test_seq, verbose=0)
print(f"CNN Model - Loss: {cnn_loss:.4f}, Accuracy: {cnn_accuracy:.4f}")

# Evaluate LSTM model
lstm_loss, lstm_accuracy = lstm_model.evaluate(X_test_seq, y_test_seq, verbose=0)
print(f"LSTM Model - Loss: {lstm_loss:.4f}, Accuracy: {lstm_accuracy:.4f}")

# Enhanced Emotion Detection Class for Graei AI
class EmotionDetectionEnsemble:
    def __init__(self):
        self.vectorizer = TfidfVectorizer()
        self.tokenizer = Tokenizer()
        self.models = {}
        self.is_trained = False
        
    def train_models(self, texts, labels):
        """Train all models in the ensemble"""
        # Preprocess texts
        processed_texts = [self.pre_process(text) for text in texts]
        
        # Traditional ML models
        X_tfidf = self.vectorizer.fit_transform(processed_texts)
        X_train, X_test, y_train, y_test = train_test_split(X_tfidf, labels, test_size=0.2, random_state=42)
        
        # Train traditional models
        self.models['naive_bayes'] = MultinomialNB()
        self.models['svm'] = SVC(probability=True)
        self.models['random_forest'] = RandomForestClassifier()
        
        for name, model in self.models.items():
            if name in ['naive_bayes', 'svm', 'random_forest']:
                model.fit(X_train, y_train)
        
        # Prepare data for deep learning models
        self.tokenizer.fit_on_texts(processed_texts)
        X_seq = self.tokenizer.texts_to_sequences(processed_texts)
        X_pad = pad_sequences(X_seq, maxlen=200)
        
        X_train_seq, X_test_seq, y_train_seq, y_test_seq = train_test_split(X_pad, labels, test_size=0.2, random_state=42)
        
        # Train CNN model
        self.models['cnn'] = self.create_cnn_model(X_train_seq.shape)
        self.models['cnn'].fit(X_train_seq, y_train_seq, epochs=5, batch_size=32, verbose=0)
        
        # Train LSTM model
        self.models['lstm'] = self.create_lstm_model(X_train_seq.shape)
        self.models['lstm'].fit(X_train_seq, y_train_seq, epochs=5, batch_size=32, verbose=0)
        
        self.is_trained = True
        
    def pre_process(self, text):
        """Preprocess text for emotion detection"""
        try:
            tokens = word_tokenize(text.lower())
            tokens = [t for t in tokens if t.isalpha()]
            stop_words = set(stopwords.words('english'))
            tokens = [t for t in tokens if t not in stop_words]
            return ' '.join(tokens)
        except:
            return text.lower()
    
    def create_cnn_model(self, input_shape):
        """Create CNN model for emotion detection"""
        model = Sequential()
        model.add(Embedding(input_dim=len(self.tokenizer.word_index) + 1, output_dim=128, input_length=input_shape[1]))
        model.add(Conv1D(128, 5, activation='relu'))
        model.add(MaxPooling1D(pool_size=2))
        model.add(Flatten())
        model.add(Dense(1, activation='sigmoid'))
        model.compile(optimizer='adam', loss='binary_crossentropy', metrics=['accuracy'])
        return model
    
    def create_lstm_model(self, input_shape):
        """Create LSTM model for emotion detection"""
        model = Sequential()
        model.add(Embedding(input_dim=len(self.tokenizer.word_index) + 1, output_dim=128, input_length=input_shape[1]))
        model.add(LSTM(128))
        model.add(Dense(1, activation='sigmoid'))
        model.compile(optimizer='adam', loss='binary_crossentropy', metrics=['accuracy'])
        return model
    
    def predict_emotion(self, text):
        """Predict emotion using ensemble of models"""
        if not self.is_trained:
            # Fallback to simple keyword-based detection
            return self.simple_emotion_detection(text)
        
        processed_text = self.pre_process(text)
        predictions = {}
        
        # Traditional ML predictions
        X_tfidf = self.vectorizer.transform([processed_text])
        
        for name in ['naive_bayes', 'svm', 'random_forest']:
            if name in self.models:
                pred = self.models[name].predict_proba(X_tfidf)[0]
                predictions[name] = pred
        
        # Deep learning predictions
        X_seq = self.tokenizer.texts_to_sequences([processed_text])
        X_pad = pad_sequences(X_seq, maxlen=200)
        
        if 'cnn' in self.models:
            predictions['cnn'] = self.models['cnn'].predict(X_pad, verbose=0)[0]
        
        if 'lstm' in self.models:
            predictions['lstm'] = self.models['lstm'].predict(X_pad, verbose=0)[0]
        
        # Ensemble prediction (weighted average)
        weights = {
            'naive_bayes': 0.15,
            'svm': 0.25,
            'random_forest': 0.20,
            'cnn': 0.30,
            'lstm': 0.10
        }
        
        final_prediction = 0
        for model_name, pred in predictions.items():
            if model_name in weights:
                if isinstance(pred, np.ndarray):
                    final_prediction += weights[model_name] * pred[0] if len(pred) > 0 else 0
                else:
                    final_prediction += weights[model_name] * pred
        
        return final_prediction
    
    def simple_emotion_detection(self, text):
        """Simple keyword-based emotion detection as fallback"""
        emotion_keywords = {
            'happy': ['happy', 'joy', 'excited', 'great', 'wonderful', 'amazing', 'fantastic'],
            'sad': ['sad', 'depressed', 'down', 'upset', 'disappointed', 'miserable'],
            'angry': ['angry', 'mad', 'frustrated', 'annoyed', 'furious', 'rage'],
            'fearful': ['scared', 'afraid', 'worried', 'anxious', 'nervous', 'terrified'],
            'surprised': ['surprised', 'shocked', 'amazed', 'unexpected', 'wow'],
            'disgusted': ['disgusted', 'gross', 'awful', 'terrible', 'hate', 'revolting']
        }
        
        text_lower = text.lower()
        emotion_scores = {}
        
        for emotion, keywords in emotion_keywords.items():
            score = sum(1 for keyword in keywords if keyword in text_lower)
            emotion_scores[emotion] = score
        
        # Return the emotion with highest score, or 'neutral' if no matches
        if max(emotion_scores.values()) > 0:
            return max(emotion_scores, key=emotion_scores.get)
        else:
            return 'neutral'

# Initialize the emotion detection ensemble
emotion_detector = EmotionDetectionEnsemble()

print("Emotion Detection Ensemble initialized successfully!")
print("This system combines:")
print("- Naive Bayes (15%)")
print("- SVM (25%)")
print("- Random Forest (20%)")
print("- CNN (30%)")
print("- LSTM (10%)")
print("\nFor comprehensive emotion analysis in the Graei AI system.")
