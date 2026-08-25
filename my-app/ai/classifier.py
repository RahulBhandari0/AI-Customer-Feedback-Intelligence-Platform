from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression

training_data = [
    ("The product is excellent", "positive"),
    ("Very happy with the service", "positive"),
    ("The product is damaged", "negative"),
    ("Delivery was very late", "negative"),
]