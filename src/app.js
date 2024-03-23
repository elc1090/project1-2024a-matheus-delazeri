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
    $('#evaluation-form').on('submit', function() {

        const doc = new PDFDocument();

        const stream = doc.pipe(BlobStream());
    
        doc
            .fontSize(12)
            .text('Hello World!');
    
        doc.end();

        stream.on('finish', function () {
            const link = document.createElement('a');
    
            const blob = stream.toBlob('application/pdf');
            link.href = URL.createObjectURL(blob);
            link.download = "file.pdf";

            document.body.append(link);
            link.click();
            link.remove();
            setTimeout(() => URL.revokeObjectURL(link.href), 7000);
        });     
    })

    
})