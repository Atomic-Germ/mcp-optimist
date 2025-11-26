#!/usr/bin/env python3
import ast
import json
import sys

def calculate_cyclomatic_complexity(node):
    complexity = 1
    for child in ast.walk(node):
        if isinstance(child, (ast.If, ast.For, ast.While, ast.With, ast.Try, ast.ExceptHandler)):
            complexity += 1
        elif isinstance(child, ast.BoolOp) and len(child.values) > 1:
            complexity += len(child.values) - 1
    return complexity

def calculate_cognitive_complexity(node):
    complexity = 0
    for child in ast.walk(node):
        if isinstance(child, (ast.If, ast.For, ast.While, ast.Try)):
            complexity += 1
    return complexity

def analyze_file(file_path):
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        tree = ast.parse(content, filename=file_path)
        functions = []

        for node in ast.walk(tree):
            if isinstance(node, ast.FunctionDef):
                cyclomatic = calculate_cyclomatic_complexity(node)
                cognitive = calculate_cognitive_complexity(node)
                nesting = 0

                functions.append({
                    'name': node.name,
                    'line': node.lineno,
                    'cyclomatic': cyclomatic,
                    'cognitive': cognitive,
                    'nestingDepth': nesting,
                    'decisionPoints': cyclomatic - 1
                })

        smells = {
            'godObjects': [],
            'longParameterLists': [],
            'longMethods': [],
            'magicNumbers': [],
            'emptyCatches': []
        }

        for node in ast.walk(tree):
            if isinstance(node, ast.FunctionDef):
                if len(node.args.args) > 5:
                    smells['longParameterLists'].append({
                        'type': 'LONG_PARAMETER_LIST',
                        'line': node.lineno,
                        'description': f'Function {node.name} has {len(node.args.args)} parameters',
                        'severity': 'medium'
                    })

                if hasattr(node, 'end_lineno') and node.end_lineno:
                    lines = node.end_lineno - node.lineno
                    if lines > 50:
                        smells['longMethods'].append({
                            'type': 'LONG_METHOD',
                            'line': node.lineno,
                            'description': f'Function {node.name} is {lines} lines long',
                            'severity': 'medium'
                        })

            elif isinstance(node, ast.Try):
                for handler in node.handlers:
                    if not handler.body:
                        smells['emptyCatches'].append({
                            'type': 'EMPTY_CATCH',
                            'line': handler.lineno if hasattr(handler, 'lineno') else 0,
                            'description': 'Empty except block',
                            'severity': 'low'
                        })

            elif isinstance(node, ast.Constant) and isinstance(node.value, int) and node.value > 10:
                smells['magicNumbers'].append({
                    'type': 'MAGIC_NUMBER',
                    'line': node.lineno if hasattr(node, 'lineno') else 0,
                    'description': f'Magic number: {node.value}',
                    'severity': 'low'
                })

        result = {
            'complexity': {
                'functions': functions,
                'totalFunctions': len(functions),
                'averageComplexity': sum(f['cyclomatic'] for f in functions) / len(functions) if functions else 0,
                'maxComplexity': max((f['cyclomatic'] for f in functions), default=0),
                'averageCognitive': sum(f['cognitive'] for f in functions) / len(functions) if functions else 0,
                'totalDecisionPoints': sum(f['decisionPoints'] for f in functions),
                'mostComplexFunction': max(functions, key=lambda f: f['cyclomatic'], default={'name': None})['name']
            },
            'smells': {
                'godObjects': smells['godObjects'],
                'longParameterLists': smells['longParameterLists'],
                'longMethods': smells['longMethods'],
                'magicNumbers': smells['magicNumbers'],
                'emptyCatches': smells['emptyCatches'],
                'classMetrics': {'total': 0, 'large': 0},
                'functionMetrics': {'total': len(functions), 'long': len(smells['longMethods'])}
            }
        }

        print(json.dumps(result, indent=2))
    except Exception as e:
        print(json.dumps({
            'error': str(e),
            'complexity': {
                'functions': [],
                'totalFunctions': 0,
                'averageComplexity': 0,
                'maxComplexity': 0,
                'averageCognitive': 0,
                'totalDecisionPoints': 0,
                'mostComplexFunction': None
            },
            'smells': {
                'godObjects': [],
                'longParameterLists': [],
                'longMethods': [],
                'magicNumbers': [],
                'emptyCatches': [],
                'classMetrics': {'total': 0, 'large': 0},
                'functionMetrics': {'total': 0, 'long': 0}
            }
        }, indent=2))

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print(json.dumps({'error': 'No file path provided'}))
        sys.exit(1)
    analyze_file(sys.argv[1])