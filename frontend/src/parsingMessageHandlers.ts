// Module for helper functions that handle messaging with luau "backend" that does all the parsing
import { ASTNode, ParseASTMessage, ParseResultMessage, VSCodeAPI } from "./typesAndInterfaces";

// Handle parse result messages from extension
export const handleParseResult = (message: ParseResultMessage,
    setIsParsing1: (isParsing: boolean) => void,
    setParseError1: (error: string | null) => void,
    setAstTree1: (astTree: ASTNode | null) => void) => {
    switch (message.status) {
      case 'loading':
        setIsParsing1(true);
        setParseError1(null);
        break;
      case 'success':
        setIsParsing1(false);
        setParseError1(null);
        if (message.astResult) {
          try {
            // Try to parse as JSON for tree view
            const parsedAST = JSON.parse(message.astResult);
            setAstTree1(parsedAST);
          } catch (e) {
            // If not JSON, handle as text (though we expect JSON from our parser)
            console.warn('Received non-JSON AST result:', e);
            setAstTree1(null);
          }
        }
        break;
      case 'error':
        setIsParsing1(false);
        setParseError1(message.error || 'Unknown parsing error');
        setAstTree1(null);
        break;
    }
  };

  // Send parse request to extension
  export const parseAST = (code: string, vscodeApi: VSCodeAPI | null, setParseError1: (error: string | null) => void) => {
    if (!vscodeApi) {
      setParseError1('VSCode API not available');
      return;
    }

    if (!code.trim()) {
      setParseError1('Please enter some code to parse');
      return;
    }

    const message: ParseASTMessage = {
      command: 'parseAST',
      code: code
    };

    vscodeApi.postMessage(message);
  };