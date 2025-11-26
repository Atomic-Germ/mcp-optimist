#!/usr/bin/env python3
import ast
import json
import sys
import re

def analyze_file(file_path, focus_area='all'):
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        lines = content.split('\n')
        tree = ast.parse(content, filename=file_path)
        opportunities = []

        # Analyze functions
        for node in ast.walk(tree):
            if isinstance(node, ast.FunctionDef):
                # Long function
                if hasattr(node, 'end_lineno') and node.end_lineno:
                    lines_count = node.end_lineno - node.lineno
                    if lines_count > 30:
                        opportunities.append({
                            'type': 'LONG_FUNCTION',
                            'description': f'Function {node.name} is {lines_count} lines long',
                            'priority': 'medium',
                            'location': {'file': file_path, 'line': node.lineno},
                            'suggestion': 'Break this function into smaller, focused functions',
                            'impact': 'Improves code maintainability and testability',
                            'example': 'def process_data(data):\n    validate(data)\n    transform(data)\n    return data\n\ndef validate(data):\n    # validation logic\n\ndef transform(data):\n    # transform logic'
                        })

                # Long parameter list
                if len(node.args.args) > 5:
                    opportunities.append({
                        'type': 'LONG_PARAMETER_LIST',
                        'description': f'Function {node.name} has {len(node.args.args)} parameters',
                        'priority': 'medium',
                        'location': {'file': file_path, 'line': node.lineno},
                        'suggestion': 'Use a parameter object or **kwargs',
                        'impact': 'Makes function calls more readable',
                        'example': 'def process(config, data, options):\n    # ...\n\n# Instead:\ndef process(params):\n    config = params[\'config\']\n    data = params[\'data\']\n    options = params[\'options\']'
                    })

        # Analyze lines for readability
        for i, line in enumerate(lines):
            # Long lines
            if len(line) > 100 and not line.strip().startswith('#'):
                opportunities.append({
                    'type': 'LONG_LINE',
                    'description': f'Line is {len(line)} characters - exceeds 100 char limit',
                    'priority': 'low',
                    'location': {'file': file_path, 'line': i + 1},
                    'suggestion': 'Break into multiple lines for better readability',
                    'impact': 'Improves code readability and maintainability',
                    'example': 'result = some_very_long_function_call(\n    with_many_parameters,\n    and_more_parameters\n)'
                })

            # Magic numbers
            magic_match = re.search(r'\b\d{3,}\b|\b[1-9]\d{2,}\b', line)
            if magic_match and not line.strip().startswith('#'):
                num = int(magic_match.group())
                if num not in [0, 1, -1, 2, 10, 100, 1000]:
                    opportunities.append({
                        'type': 'MAGIC_NUMBER',
                        'description': f'Magic number {num} found - should be named constant',
                        'priority': 'low',
                        'location': {'file': file_path, 'line': i + 1},
                        'suggestion': 'Extract to a named constant',
                        'impact': 'Makes code more maintainable and self-documenting',
                        'example': f'MAX_RETRIES = {num}\n# Instead of using {num} directly'
                    })

        # Filter by focus area
        if focus_area != 'all':
            if focus_area == 'performance':
                opportunities = [o for o in opportunities if o['type'] in ['LONG_FUNCTION']]
            elif focus_area == 'maintainability':
                opportunities = [o for o in opportunities if o['type'] in ['LONG_FUNCTION', 'LONG_PARAMETER_LIST', 'MAGIC_NUMBER']]
            elif focus_area == 'readability':
                opportunities = [o for o in opportunities if o['type'] in ['LONG_LINE', 'MAGIC_NUMBER']]

        result = {
            'opportunities': opportunities,
            'totalOpportunities': len(opportunities),
            'priorityBreakdown': {
                'high': len([o for o in opportunities if o['priority'] == 'high']),
                'medium': len([o for o in opportunities if o['priority'] == 'medium']),
                'low': len([o for o in opportunities if o['priority'] == 'low'])
            },
            'focusArea': focus_area
        }

        print(json.dumps(result, indent=2))
    except Exception as e:
        print(json.dumps({
            'error': str(e),
            'opportunities': [],
            'totalOpportunities': 0,
            'priorityBreakdown': {'high': 0, 'medium': 0, 'low': 0},
            'focusArea': focus_area
        }, indent=2))

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print(json.dumps({'error': 'No file path provided'}))
        sys.exit(1)
    focus_area = sys.argv[2] if len(sys.argv) > 2 else 'all'
    analyze_file(sys.argv[1], focus_area)