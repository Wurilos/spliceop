import { useState, useCallback } from 'react';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, Download } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { parseExcelFile, mapExcelData, generateTemplate, ColumnMapping, ImportResult } from '@/lib/import';
import { cn } from '@/lib/utils';

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  columnMappings: ColumnMapping[];
  templateColumns: { key: string; label: string }[];
  templateFilename: string;
  onImport: (data: any[]) => Promise<void>;
}

type ImportStep = 'upload' | 'preview' | 'importing' | 'complete';

export function ImportDialog({
  open,
  onOpenChange,
  title,
  description,
  columnMappings,
  templateColumns,
  templateFilename,
  onImport,
}: ImportDialogProps) {
  const [step, setStep] = useState<ImportStep>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<ImportResult<any> | null>(null);
  const [importProgress, setImportProgress] = useState(0);
  const [importError, setImportError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const reset = () => {
    setStep('upload');
    setFile(null);
    setResult(null);
    setImportProgress(0);
    setImportError(null);
  };

  const handleClose = (open: boolean) => {
    if (!open) reset();
    onOpenChange(open);
  };

  const handleFileSelect = async (selectedFile: File) => {
    if (!selectedFile.name.match(/\.(xlsx|xls)$/i)) {
      setImportError('Por favor, selecione um arquivo Excel (.xlsx ou .xls)');
      return;
    }

    setFile(selectedFile);
    setImportError(null);

    try {
      const rawData = await parseExcelFile(selectedFile);
      const mappedResult = mapExcelData(rawData, columnMappings);
      setResult(mappedResult);
      setStep('preview');
    } catch (error) {
      setImportError('Erro ao processar arquivo. Verifique o formato.');
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) handleFileSelect(droppedFile);
  }, [columnMappings]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleImport = async () => {
    if (!result || result.data.length === 0) return;

    setStep('importing');
    setImportProgress(0);

    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setImportProgress((prev) => Math.min(prev + 10, 90));
      }, 100);

      await onImport(result.data);

      clearInterval(progressInterval);
      setImportProgress(100);
      setStep('complete');
    } catch (error: any) {
      const message =
        typeof error?.message === 'string'
          ? error.message
          : 'Erro ao importar dados. Tente novamente.';
      setImportError(message);
      setStep('preview');
    }
  };

  const downloadTemplate = () => {
    generateTemplate(templateColumns, templateFilename);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            {title}
          </DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        {/* Upload Step */}
        {step === 'upload' && (
          <div className="space-y-4">
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={cn(
                'border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer',
                isDragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'
              )}
              onClick={() => document.getElementById('file-input')?.click()}
            >
              <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-2">
                Arraste um arquivo Excel ou clique para selecionar
              </p>
              <p className="text-xs text-muted-foreground">Formatos aceitos: .xlsx, .xls</p>
              <input
                id="file-input"
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFileSelect(f);
                }}
              />
            </div>

            {importError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{importError}</AlertDescription>
              </Alert>
            )}

            <div className="flex justify-between items-center pt-2">
              <Button variant="outline" size="sm" onClick={downloadTemplate}>
                <Download className="h-4 w-4 mr-2" />
                Baixar Template
              </Button>
              <Button variant="ghost" onClick={() => handleClose(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {/* Preview Step */}
        {step === 'preview' && result && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
              <FileSpreadsheet className="h-8 w-8 text-primary" />
              <div className="flex-1">
                <p className="font-medium">{file?.name}</p>
                <p className="text-sm text-muted-foreground">
                  {result.totalRows} registros encontrados
                </p>
              </div>
            </div>

            {importError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{importError}</AlertDescription>
              </Alert>
            )}

            {result.validRows < result.totalRows && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {result.totalRows - result.validRows} registro(s) com erro serão ignorados
                </AlertDescription>
              </Alert>
            )}

            {result.errors.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-destructive">Erros encontrados:</p>
                <ScrollArea className="h-32 rounded border p-2">
                  <ul className="text-sm space-y-1">
                    {result.errors.slice(0, 20).map((error, i) => (
                      <li key={i} className="text-destructive">
                        {error}
                      </li>
                    ))}
                    {result.errors.length > 20 && (
                      <li className="text-muted-foreground">
                        ... e mais {result.errors.length - 20} erros
                      </li>
                    )}
                  </ul>
                </ScrollArea>
              </div>
            )}

            <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-900">
              <p className="text-sm font-medium text-green-800 dark:text-green-200">
                <CheckCircle2 className="h-4 w-4 inline mr-2" />
                {result.validRows} registro(s) prontos para importar
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={reset}>
                Voltar
              </Button>
              <Button onClick={handleImport} disabled={result.validRows === 0}>
                Importar {result.validRows} Registro(s)
              </Button>
            </div>
          </div>
        )}

        {/* Importing Step */}
        {step === 'importing' && (
          <div className="space-y-4 py-8">
            <div className="text-center">
              <p className="text-lg font-medium mb-4">Importando dados...</p>
              <Progress value={importProgress} className="h-2" />
              <p className="text-sm text-muted-foreground mt-2">{importProgress}%</p>
            </div>
          </div>
        )}

        {/* Complete Step */}
        {step === 'complete' && result && (
          <div className="space-y-4 py-8">
            <div className="text-center">
              <CheckCircle2 className="h-16 w-16 mx-auto text-green-500 mb-4" />
              <p className="text-lg font-medium">Importação Concluída!</p>
              <p className="text-sm text-muted-foreground mt-2">
                {result.validRows} registro(s) importados com sucesso
              </p>
            </div>
            <div className="flex justify-center">
              <Button onClick={() => handleClose(false)}>Fechar</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
