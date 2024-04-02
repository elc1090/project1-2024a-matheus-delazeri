import $ from 'jquery'
import SignaturePad from 'signature_pad'
import PDFDocument from 'pdfkit'
import BlobStream from 'blob-stream'

$(document).ready(function () {

    function parse_queryString(query) {
        var vars = query.split("&");
        var queryString = {};
        for (var i = 0; i < vars.length; i++) {
            var pair = vars[i].split("=");
            var key = decodeURIComponent(pair.shift());
            var value = decodeURIComponent(pair.join("="));
            if (typeof queryString[key] === "undefined") {
                queryString[key] = value;
            } else if (typeof queryString[key] === "string") {
                var arr = [queryString[key], value];
                queryString[key] = arr;
            } else {
                queryString[key].push(value);
            }
        }

        return queryString;
    }

    function updateTotal() {
        var sum = 0
        $('.evaluation-item').each(function () {
            var val = parseFloat($(this).val(), 2)
            if (!isNaN(val)) sum += val
        })
        $('#evaluation-total').val(sum)
    }

    function autoFillForm(formString) {
        try {
            var formArray = JSON.parse(Buffer.from(formString, "base64").toString())
            var form = $("#evaluation-form")
            formArray.forEach(function (pair) {
                var selector = `input[name="${pair.name}"], textarea[name="${pair.name}"]`
                var input = $(form).find(selector)
                input.val(pair.value);
            })
        } catch (e) {
            console.log(e)
            alert('Ńão foi possível carregar este formulário.')
        }

    }

    function updateFormLink() {
        var formArray = $('form').serializeArray()
        var formString = Buffer.from(JSON.stringify(formArray)).toString("base64")
        var url = location.protocol + "//" + location.host + location.pathname + "?form=" + formString

        $("#form-link").val(url)
    }

    function writePdf() {
        const doc = new PDFDocument();
        const pageWidth = doc.page.width;

        const centerX = pageWidth / 2;

        const stream = doc.pipe(BlobStream());

        let title = "FICHA DE AVALIAÇÃO DA SESSÃO DE ANDAMENTO"
        let header = "Ministério da Educação\nUniversidade Federal de Santa Maria\nCentro de Tecnologia\nCurso de Ciência da Computação";

        let dateObject = new Date(document.getElementById('date').value);
        let day = dateObject.getDate().toString().padStart(2, '0');
        let month = (dateObject.getMonth() + 1).toString().padStart(2, '0');
        let year = dateObject.getFullYear();
        let hour = dateObject.getHours().toString().padStart(2, '0');
        let minute = dateObject.getMinutes().toString().padStart(2, '0');
        let formattedDate = `${day}/${month}/${year} ${hour}:${minute}`;

        let content = `Aluno: ${document.getElementById('student-name').value}\nProfessor: ${document.getElementById('evaluator-name').value}\nData: ${formattedDate}\nSemestre: ${document.getElementById('semester').value}`;

        doc.font('Helvetica');

        doc.fontSize(12)
            .text(header, { align: 'center' })
            .moveDown(3);

        doc.fontSize(16)
            .text(title, { align: 'center' })
            .moveDown(1.5);

        doc.fontSize(12)
            .text(content, centerX - 200)
            .moveDown(0.5);

        const n = 2;
        const m = 5;
        const tableData = [
            ['Critério', 'Nota'],
            ['Relevância e originalidade (até 2.0)', document.getElementById('evaluation-relevance').value],
            ['Qualidade do conteúdo (até 3.0)', document.getElementById('evaluation-quality').value],
            ['Apresentação (até 5.0)', document.getElementById('evaluation-presentation').value],
            ['Nota (total)', document.getElementById('evaluation-total').value]
        ];

        const columnWidth = 200;
        const rowHeight = 30;
        const tableWidth = n * columnWidth; 
        const startX = (doc.page.width - tableWidth) / 2;
        let startY = doc.y + 20;

        for (let i = 0; i < m; i++) {
            for (let j = 0; j < n; j++) {
                const cellData = tableData[i][j];
                doc.rect(startX + j * columnWidth, startY + i * rowHeight, columnWidth, rowHeight)
                    .stroke("#4e4e4e")
                doc.text(cellData, startX + j * columnWidth + 5, startY + i * rowHeight + 10, { width: columnWidth - 10, align: 'left' }); // Ajusta o alinhamento vertical do texto
            }
        }


        const canvas = document.getElementById("canvas-signature");
        const imageData = canvas.toDataURL("image/png");
        doc.image(imageData, centerX - 20, doc.y + 70, { height: 32 });

        doc
            .moveTo(centerX - 100, doc.y + 100) 
            .lineTo(centerX + 100, doc.y + 100) 
            .stroke(); 

        const signatureTextWidth = doc.widthOfString("Assinatura do(a) avaliador(a)");
        const signatureTextX = centerX - signatureTextWidth / 2;

        doc
            .text(`Assinatura do(a) avaliador(a)`, signatureTextX, doc.y + 110);

        doc.end();

        stream.on('finish', function () {
            const link = document.createElement('a');

            const blob = stream.toBlob('application/pdf');
            link.href = URL.createObjectURL(blob);
            link.download = "document.pdf";

            document.body.append(link);
            link.click();
            link.remove();
            setTimeout(() => URL.revokeObjectURL(link.href), 7000);
        });
    }

    $('input').on('change', updateFormLink)
    $('.evaluation-item').on('change', updateTotal)


    var query = window.location.search.substring(1);
    var qs = parse_queryString(query);
    if ('form' in qs) {
        autoFillForm(qs.form)
    }

    updateFormLink()
    updateTotal()

    const canvas = document.getElementById('canvas-signature')
    const signaturePad = new SignaturePad(canvas);

    $('#canvas-clear-btn').on('click', function () { signaturePad.clear() })
    $('#evaluation-form').on('submit', writePdf)

})