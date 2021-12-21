// Подключаем модули
const http = require('http');
const fs = require('fs');
const path = require('path');

// 1. Сервер
http.createServer( (req, res) => {
    // Внутри сервера необходимо задать роутинг. 
    // В данном случае будет работать только с тремя видами адресов: 1) Корень - стартовую страницу (когда обращаются к имени по серверу);
    // 2) Если обращаются к загрузке файлов (в данном случае загрузка файлов идет в папку uploads, необходимо как-то на это реагировать).
    // 3) Работа со статикой - если загружаются css, html, js файлы, картинки. Необходимо обработать статику и отдать её. 
    console.log(`req: ${req.url}`);
    if (req.url === '/') {
        sendRes('index.html', 'text/html', res); // функции передается res, чтобы она смогла ответить за нас 
    } else if (/\/uploads\/[^\/]+$/.test(req.url) && req.method === 'POST') {
    // необходимо вызвать обработчик файлов
        console.log('upload files');
        saveUploadFile(req, res);
    } else {
        sendRes(req.url, getContentType(req.url), res);
    }
}).listen(3000, () => {
    console.log('server start 3000');
});

// 2. Отправка ресурсов (обработка ресурсов)
function sendRes(url, contentType, res) {
    // Переменная file сформирует путь
    let file = path.join(__dirname + '/static/', url); // __dirname - спец параметр, который указывает имя папки на сервере в которой всё это происходит
    fs.readFile(file, (err, content) => {
        if (err) {
            res.writeHead(404); // устанавливает заголовок
            res.write('file not found'); // сообщаем ответ
            res.end();
            console.log(`error 404 ${file}`);
        } else {
            res.writeHead(200, {'Content-Type': contentType});
            res.write(content);
            res.end();
            console.log(`res 200 ${file}`);
        }
    })
}

// 3. Тип контента (для отправки ресурсов необходимо получить тип контента внутри них)

function getContentType(url) {
    switch (path.extname(url)) {
        case ".html":
            return "text/html";
        case ".css":
            return "text/css";
        case ".js":
            return "text/javascript";
        case ".json":
            return "application/json";
        default:
            return "application/octate-stream";
    }
}

// 4. Сохранение файла (из двух частей). Вторая - AJAX запрос, который отправляет всё на сервер.
// Первая - обработчик сервера.

function saveUploadFile(req, res) {
// Во-первых, необходимо получить имя файла
    let fileName = path.basename(req.url);
// Также, необходимо получить путь к файлу
    let file = path.join(__dirname, 'uploads', fileName);
// Теперь мы должны получить имя папки, куда будем выгружать (в данном случае папка images)
    let imageFolder = path.join(__dirname, 'static/images', fileName);

// Чтение файлов. createWriteStream - читаем поток
    req.pipe(fs.createWriteStream(file));
// Дальше вешаем событие, когда чтение файла закончиться
    req.on('end', () => {
// Если всё пошло хорошо, то будем обрабатывать копирование файла
        fs.copyFile(file, imageFolder, err => { // копируюется из file в imageFolder
            if (err) {
                console.log(err);
            } else {
// После копирования файла, копия файла остается в папке uploads, поэтому необходимо удалить файл
                fs.unlink(file, err => {
                    console.log(err);
                })
            }
        })
// После копирование необходим отдать клиенту информацию о файле: записать заголовки и передать content type
        res.writeHead(200, {'Content-Type': 'text'});
        res.write(fileName);
        res.end();
    })
}