# GRAI-EL
The holy grai-el  is a generative response artificial intelligigence focusing on emotional linguistics
Here's the updated code that includes model training, biased mitigation, and emotional detection:

```
# Import necessary libraries
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
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense, Embedding, LSTM
from tensorflow.keras.preprocessing.text import Tokenizer
from tensorflow.keras.preprocessing.sequence import pad_sequences

# Load the text data
with open('efwa.txt', 'r') as f:
    text_data = f.read()

# Split the text data into individual samples
samples = text_data.split('\n')

# Create a list to store the labels
labels = []

# Assign labels to each sample (you'll need to modify this based on your specific labels)
for i, sample in enumerate(samples):
    if i % 2 == 0:
        labels.append(0)  # Label 0 for even-indexed samples
    else:
        labels.append(1)  # Label 1 for odd-indexed samples

# Create a DataFrame to store the text data and labels
df = pd.DataFrame({'text': samples, 'label': labels})

# Preprocess the text data
nltk.download('stopwords')
stop_words = set(stopwords.words('english'))

def pre_process(text):
    tokens = word_tokenize(text)
    tokens = [t for t in tokens if t.isalpha()]
    tokens = [t for t in tokens if t not in stop_words]
    return ' '.join(tokens)

df['text'] = df['text'].apply(pre_process)

# Split the data into training and testing sets
X_train, X_test, y_train, y_test = train_test_split(df['text'], df['label'], test_size=0.2, random_state=42)

# Create a TF-IDF vectorizer to convert the text data into numerical features
vectorizer = TfidfVectorizer()
X_train_tfidf = vectorizer.fit_transform(X_train)
X_test_tfidf = vectorizer.transform(X_test)
Here is the revised code with the training models included:


#(previous code remains the same)

# Train a Multinomial Naive Bayes classifier on the training data
nb_model = MultinomialNB()
nb_model.fit(X_train_tfidf, y_train)

# Train a Support Vector Machine classifier on the training data
svm_model = SVC()
svm_model.fit(X_train_tfidf, y_train)

# Train a Random Forest classifier on the training data
rf_model = RandomForestClassifier()
rf_model.fit(X_train_tfidf, y_train)

# Train a Convolutional Neural Network (CNN) model on the training data
cnn_model = Sequential()
cnn_model.add(Embedding(5000, 100, input_length=200))
cnn_model.add(Conv1D(64, kernel_size=3, activation='relu'))
cnn_model.add(MaxPooling1D(pool_size=2))
cnn_model.add(Flatten())
cnn_model.add(Dense(64, activation='relu'))
cnn_model.add(Dense(1, activation='sigmoid'))
cnn_model.compile(loss='binary_crossentropy', optimizer='adam', metrics=['accuracy'])
cnn_model.fit(padded_sequences, df['label'], epochs=10, batch_size=32)

# Train a Long Short-Term Memory (LSTM) model on the training data
lstm_model = Sequential()
lstm_model.add(Embedding(5000, 100, input_length=200))
lstm_model.add(LSTM(64, dropout=0.2))
lstm_model.add(Dense(64, activation='relu'))
lstm_model.add(Dense(1, activation='sigmoid'))
lstm_model.compile(loss='binary_crossentropy', optimizer='adam', metrics=['accuracy'])
lstm_model.fit(padded_sequences, df['label'], epochs=10, batch_size=32)

#(previous code remains the same)


This revised code includes the training of the CNN and LSTM models using the `padded_sequences` and `df['label']` data.
# Train a Multinomial Naive Bayes classifier on the training data
nb_model = MultinomialNB()
nb_model.fit(X_train_tfidf, y_train)

# Train a Support Vector Machine classifier on the training data
svm_model = SVC()
svm_model.fit(X_train_tfidf, y_train)

# Train a Random Forest classifier on the training data
rf_model = RandomForestClassifier()
rf_model.fit(X_train_tfidf, y_train)

# Evaluate the performance of each model on the testing data
nb_y_pred = nb_model.predict(X_test_tfidf)
nb_accuracy = accuracy_score(y_test, nb_y_pred)
print(f'Multinomial Naive Bayes Accuracy: {nb_accuracy}')

svm_y_pred = svm_model.predict(X_test_tfidf)
svm_accuracy = accuracy_score(y_test, svm_y_pred)
print(f'Support Vector Machine Accuracy: {svm_accuracy}')

rf_y_pred = rf_model.predict(X_test_tfidf)
rf_accuracy = accuracy_score(y_test, rf_y_pred)
print(f'Random Forest Accuracy: {rf_accuracy}')

# Implement biased mitigation and emotional detection using the trained models
def biased_mitigation(text):
    # Use the trained models to predict the label for the input text
    text_tfidf = vectorizer.transform([text])
    nb_pred = nb_model.predict(text_tfidf)
    svm_pred = svm_model.predict(text_tfidf)
    rf_pred = rf_model.predict(text_tfidf)
    
    # Implement biased mitigation logic here
    # For example, you could use the predicted labels to determine whether the input text contains biased language
    if nb_pred == 1 or svm_pred == 1 or rf_pred == 1:
        return "Biased language detected"
    else:
        return "No biased language detected"

def emotional_detection(text):
    # Use the trained models to predict the label for the input text
    text_tfidf = vectorizer.transform([text])
    nb_pred = nb_model.predict(text_tfidf)
    svm_pred = svm_model.predict(text_tfidf)
    rf_pred = rf_model.predict(text_tfidf)
    
    # Implement emotional detection logic here
    # For example, you could use the predicted labels to determine the emotional tone of the input text
    if nb_pred == 1 or svm_pred == 1 or rf_pred == 1:
        return "Positive emotional tone detected"
    else:
        return "Negative emotional tone detected"

# Test the biased mitigation and emotional detection functions
text = "This is a sample text"
print(biased_mitigation(text))
print(emotional_detection(text))
```

This code includes the implementation of biased
