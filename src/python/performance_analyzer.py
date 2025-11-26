#!/usr/bin/env python3
import ast
import json
import sys

def analyze_file(file_path):
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        tree = ast.parse(content, filename=file_path)
        loops = []
        functions = []
        string_concat_issues = []

        # Track loop depth
        loop_stack = []

        for node in ast.walk(tree):
            if isinstance(node, ast.FunctionDef):
                functions.append({
                    'name': node.name,
                    'line': node.lineno,
                    'params': len(node.args.args)
                })

            elif isinstance(node, (ast.For, ast.While)):
                depth = len(loop_stack) + 1
                loop_stack.append(depth)

                loop_type = 'for' if isinstance(node, ast.For) else 'while'
                loops.append({
                    'type': loop_type,
                    'depth': depth,
                    'line': node.lineno,
                    'column': 0
                })

                # Check for string concat in loop
                for child in ast.walk(node):
                    if isinstance(child, ast.AugAssign) and isinstance(child.op, ast.Add):
                        if hasattr(child.value, 'value') and isinstance(child.value.value, str):
                            string_concat_issues.append({
                                'line': child.lineno,
                                'variable': 'string_var'  # simplified
                            })

                loop_stack.pop()

        result = {
            'loops': loops,
            'functions': functions,
            'stringConcatIssues': string_concat_issues
        }

        print(json.dumps(result, indent=2))
    except Exception as e:
        print(json.dumps({
            'error': str(e),
            'loops': [],
            'functions': [],
            'stringConcatIssues': []
        }, indent=2))

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print(json.dumps({'error': 'No file path provided'}))
        sys.exit(1)
    analyze_file(sys.argv[1])