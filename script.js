// Lógica de seleção, reordenação e junção de arquivos PDF.
// Tudo roda no navegador, usando pdf-lib (carregado via CDN em index.html).

const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('file-input');
const fileListEl = document.getElementById('file-list');
const mergeSummaryEl = document.getElementById('merge-summary');
const statusEl = document.getElementById('status');
const mergeBtn = document.getElementById('merge-btn');
const downloadArea = document.getElementById('download-area');
const downloadLink = document.getElementById('download-link');

// Estado: lista ordenada de arquivos selecionados.
// Cada item: { id, file, name, pageCount, bytes, error, thumbnail }
let files = [];
let currentDownloadUrl = null;
let dragSourceId = null;

// O worker do PDF.js roda a renderização fora da thread principal.
pdfjsLib.GlobalWorkerOptions.workerSrc =
  'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';

// Largura da miniatura em pixels de layout (renderizada em 2x para telas retina).
const THUMB_WIDTH = 40;

init();

function init() {
  dropzone.addEventListener('click', () => fileInput.click());
  dropzone.addEventListener('keydown', onDropzoneKeydown);
  dropzone.addEventListener('dragover', onDropzoneDragOver);
  dropzone.addEventListener('dragleave', onDropzoneDragLeave);
  dropzone.addEventListener('drop', onDropzoneDrop);

  fileInput.addEventListener('change', (e) => {
    handleNewFiles(e.target.files);
    fileInput.value = ''; // permite selecionar o mesmo arquivo de novo depois
  });

  fileListEl.addEventListener('click', onFileListClick);
  mergeBtn.addEventListener('click', mergeAndDownload);
}

function onDropzoneKeydown(e) {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    fileInput.click();
  }
}

function onDropzoneDragOver(e) {
  e.preventDefault();
  dropzone.classList.add('drag-over');
}

function onDropzoneDragLeave() {
  dropzone.classList.remove('drag-over');
}

function onDropzoneDrop(e) {
  e.preventDefault();
  dropzone.classList.remove('drag-over');
  handleNewFiles(e.dataTransfer.files);
}

// Adiciona os arquivos escolhidos ao estado, lendo o número de páginas de cada um.
async function handleNewFiles(fileList) {
  const novos = Array.from(fileList);
  if (novos.length === 0) return;

  for (const file of novos) {
    const entry = { id: crypto.randomUUID(), file, name: file.name, pageCount: null, bytes: null, error: null, thumbnail: null };
    files.push(entry);
    await lerPdf(entry);
  }

  resetDownloadState();
  renderFileList();

  // Gera as miniaturas depois de exibir a lista, para não atrasar o feedback inicial.
  await gerarThumbnailsPendentes();
}

// Renderiza a 1ª página de cada PDF ainda sem miniatura e atualiza só a imagem daquele item.
async function gerarThumbnailsPendentes() {
  for (const entry of files) {
    if (entry.error || !entry.bytes || entry.thumbnail) continue;
    await gerarThumbnail(entry);

    // Troca o placeholder pelo markup atualizado (span de carregamento -> imagem).
    const wrap = fileListEl.querySelector(`.file-item[data-id="${entry.id}"] .file-thumb-wrap`);
    if (wrap) {
      wrap.innerHTML = thumbMarkup(entry);
    }
  }
}

// Usa o PDF.js para desenhar a primeira página num canvas e guardar como data URL.
// Passa uma cópia dos bytes: o PDF.js "consome" (detacha) o buffer que recebe.
async function gerarThumbnail(entry) {
  try {
    const doc = await pdfjsLib.getDocument({ data: entry.bytes.slice(0) }).promise;
    const page = await doc.getPage(1);

    const base = page.getViewport({ scale: 1 });
    const scale = (THUMB_WIDTH * 2) / base.width;
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    const ctx = canvas.getContext('2d');

    await page.render({ canvasContext: ctx, viewport }).promise;
    entry.thumbnail = canvas.toDataURL('image/png');
    doc.destroy();
  } catch (err) {
    // Sem miniatura, mostramos um ícone genérico — não é motivo para bloquear o merge.
    entry.thumbnail = null;
  }
}

// Lê o arquivo e extrai o número de páginas via pdf-lib.
// Se falhar, marca o item com uma mensagem de erro específica (não entra na junção).
async function lerPdf(entry) {
  try {
    const bytes = await entry.file.arrayBuffer();
    const pdf = await PDFLib.PDFDocument.load(bytes, { ignoreEncryption: true });
    entry.bytes = bytes;
    entry.pageCount = pdf.getPageCount();
  } catch (err) {
    entry.error = 'Este arquivo não é um PDF válido ou está corrompido.';
  }
}

function onFileListClick(e) {
  const btn = e.target.closest('button');
  if (!btn) return;
  const li = btn.closest('.file-item');
  const id = li.dataset.id;

  if (btn.classList.contains('remove-btn')) {
    removeFile(id);
  } else if (btn.classList.contains('move-up')) {
    moveFile(id, -1, btn.className);
  } else if (btn.classList.contains('move-down')) {
    moveFile(id, 1, btn.className);
  }
}

function removeFile(id) {
  files = files.filter((f) => f.id !== id);
  resetDownloadState();
  renderFileList();
}

// Move um item na lista e devolve o foco ao botão equivalente, para uso por teclado.
function moveFile(id, direction, focusClass) {
  const index = files.findIndex((f) => f.id === id);
  const newIndex = index + direction;
  if (newIndex < 0 || newIndex >= files.length) return;

  [files[index], files[newIndex]] = [files[newIndex], files[index]];
  resetDownloadState();
  renderFileList();

  const focusBtn = fileListEl.querySelector(`.file-item[data-id="${id}"] .${focusClass}`);
  focusBtn?.focus();
}

function renderFileList() {
  fileListEl.innerHTML = '';

  files.forEach((entry, index) => {
    const li = document.createElement('li');
    li.className = 'file-item' + (entry.error ? ' file-item--error' : '');
    li.dataset.id = entry.id;
    li.draggable = true;
    li.setAttribute('role', 'listitem');

    li.addEventListener('dragstart', () => {
      dragSourceId = entry.id;
      li.classList.add('dragging');
    });
    li.addEventListener('dragend', () => li.classList.remove('dragging'));
    li.addEventListener('dragover', (e) => e.preventDefault());
    li.addEventListener('drop', (e) => {
      e.preventDefault();
      if (dragSourceId && dragSourceId !== entry.id) {
        reorderByDrag(dragSourceId, entry.id);
      }
    });

    const pagesText = entry.error
      ? entry.error
      : entry.pageCount === 1
        ? '1 página'
        : `${entry.pageCount} páginas`;

    li.innerHTML = `
      <span class="drag-handle" aria-hidden="true">&#10021;</span>
      <div class="file-thumb-wrap">${thumbMarkup(entry)}</div>
      <div class="file-info">
        <span class="file-name">${escapeHtml(entry.name)}</span>
        <span class="file-pages">${pagesText}</span>
      </div>
      <div class="file-item-actions">
        <button type="button" class="icon-btn move-up" aria-label="Mover ${escapeHtml(entry.name)} para cima" ${index === 0 ? 'disabled' : ''}>&#8593;</button>
        <button type="button" class="icon-btn move-down" aria-label="Mover ${escapeHtml(entry.name)} para baixo" ${index === files.length - 1 ? 'disabled' : ''}>&#8595;</button>
        <button type="button" class="icon-btn remove-btn" aria-label="Remover ${escapeHtml(entry.name)}">&#10005;</button>
      </div>
    `;

    fileListEl.appendChild(li);
  });

  updateMergeSummary();
  updateMergeButtonState();
}

// Reordena a lista ao soltar um item arrastado sobre outro.
function reorderByDrag(sourceId, targetId) {
  const sourceIndex = files.findIndex((f) => f.id === sourceId);
  const targetIndex = files.findIndex((f) => f.id === targetId);
  const [moved] = files.splice(sourceIndex, 1);
  files.splice(targetIndex, 0, moved);
  resetDownloadState();
  renderFileList();
}

function updateMergeSummary() {
  if (files.length === 0) {
    mergeSummaryEl.textContent = '';
    return;
  }
  const validos = files.filter((f) => !f.error).length;
  mergeSummaryEl.textContent = `${validos} de ${files.length} arquivo(s) serão juntados, na ordem mostrada abaixo.`;
}

function updateMergeButtonState() {
  const validos = files.filter((f) => !f.error).length;
  mergeBtn.disabled = validos < 2;
}

function resetDownloadState() {
  downloadArea.hidden = true;
  if (currentDownloadUrl) {
    URL.revokeObjectURL(currentDownloadUrl);
    currentDownloadUrl = null;
  }
  setStatus('', null);
}

function setStatus(message, state) {
  statusEl.textContent = message;
  if (state) {
    statusEl.dataset.state = state;
  } else {
    delete statusEl.dataset.state;
  }
}

async function mergeAndDownload() {
  const validos = files.filter((f) => !f.error);
  if (validos.length < 2) return;

  mergeBtn.disabled = true;
  setStatus('Juntando PDFs, aguarde...', 'loading');

  try {
    const pdfFinal = await PDFLib.PDFDocument.create();

    for (const entry of validos) {
      const doc = await PDFLib.PDFDocument.load(entry.bytes, { ignoreEncryption: true });
      const paginasCopiadas = await pdfFinal.copyPages(doc, doc.getPageIndices());
      paginasCopiadas.forEach((pagina) => pdfFinal.addPage(pagina));
    }

    const bytesFinais = await pdfFinal.save();
    const blob = new Blob([bytesFinais], { type: 'application/pdf' });
    currentDownloadUrl = URL.createObjectURL(blob);
    downloadLink.href = currentDownloadUrl;
    downloadArea.hidden = false;
    setStatus('PDF pronto! Use o link abaixo para baixar.', 'success');
  } catch (err) {
    setStatus('Não foi possível juntar os PDFs. Verifique se todos os arquivos são válidos.', 'error');
  } finally {
    updateMergeButtonState();
  }
}

// Miniatura do item: imagem pronta, placeholder de carregamento ou ícone de erro.
function thumbMarkup(entry) {
  if (entry.error) {
    return '<span class="file-thumb file-thumb--error" aria-hidden="true">PDF</span>';
  }
  if (entry.thumbnail) {
    return `<img class="file-thumb" src="${entry.thumbnail}" alt="Prévia da primeira página de ${escapeHtml(entry.name)}">`;
  }
  return '<span class="file-thumb file-thumb--loading" aria-hidden="true"></span>';
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
