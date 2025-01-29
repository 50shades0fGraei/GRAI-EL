import random

# Sample pairs of patterns and responses
pairs = [
    [
        r"Hi|Hello|Hey",
        ["Hello! How are you?", "Hi there! What's new?", "Hey! How's it going?"]
    ],
    [
        r"I am (.*)",
        ["That's great to hear!", "Oh no, what's wrong?", "How can I help you today?"]
    ],
    [
        r"What is your name ?",
        ["I am a simple chatbot created to help you.", ]
    ],
    [
        r"How are you ?",
        ["I'm doing well, thank you for asking!", "I'm just a bunch of code, but I'm functioning perfectly!"]
    ],
    [
        r"quit",
        ["Goodbye! It was nice talking to you.", ]
    ],
]

# Function to simulate AI conversation with itself
def self_talking_ai():
    print("Starting self-talking AI. Type 'quit' to stop.")
    user_input = "Hi"
    while user_input.lower() != "quit":
        print("You:", user_input)
        matched = False
        for pattern, responses in pairs:
            if any(word.lower() in user_input.lower() for word in pattern.split('|')):
                response = random.choice(responses)
                print("AI:", response)
                user_input = response
                matched = True
                break
        if not matched:
            user_input = "Hi"

if __name__ == "__main__":
    self_talking_ai()
