def calculate_total(items):
    total = 0
    for item in items:
        if item > 0:
            total += item
    return total

def process_data(data, config, options, logger, cache):
    if not data:
        return None
    
    result = []
    for i in range(1000):  # Magic number
        if i % 2 == 0:
            result.append(i * 2)
    
    return result

class DataProcessor:
    def __init__(self):
        self.data = []
    
    def add_item(self, item):
        self.data.append(item)
    
    def process_all(self):
        results = []
        for item in self.data:
            processed = self._process_item(item)
            results.append(processed)
        return results
    
    def _process_item(self, item):
        # Long line that exceeds 100 characters for testing readability suggestions
        return f"Processed item: {item} with some additional text to make this line very long indeed"