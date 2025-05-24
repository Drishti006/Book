import express from 'express';
import bodyParser from 'body-parser';
import axios from 'axios';
import pg from 'pg';

// setup
const app = express();
const port = 3000;
const db = new pg.Client({
    user: 'postgres',
    host: 'localhost',
    database: 'books',
    password: 'Drishti@77329',
    port: 5432
})

//Connecting to the database
db.connect();

// Middleware
app.use(express.static('public'))
app.use(bodyParser.urlencoded({extended:true}))

//Fetching data from the database
async function fetchData() {
    try {
        const result = await db.query('SELECT * FROM books');
        return result.rows;
    } catch (error) {
        console.log("Failed at fetching the data from the database",error)
    }
}
   
// Home route
app.get('/', async (req, res) =>{
    const books = await fetchData();
    res.render("index.ejs",{
        books:books
    })
})
// Home route for add -- redirecting to home from /add page
app.get('/home', (req, res) =>{
    res.redirect('/')
})

//Add route
app.get('/add', async (req, res) =>{
    res.render("add.ejs")
})
app.post('/new',async (req,res)=>{
    const response = await axios.get(`https://openlibrary.org/search.json?q=${encodeURIComponent(req.body.title)}`)
    const olid = response.data.docs[0].cover_edition_key;
    try {
        db.query("INSERT INTO books (title, author, rating, notes,olid) VALUES ($1,$2,$3,$4,$5)",[req.body.title, req.body.author,req.body.rating,req.body.notes,olid])
        res.redirect('/')
    } catch (err) {
        console.log("Error while inserting the data into the database",err)
    }
})


// Editing a note
app.get('/edit/:id',async (req, res) => {
    const id = req.params.id;
    const books = await fetchData();
    const book = books.find(b => String(b.id) === String(id));
    if (!book) {
        return res.status(404).send("Book not found");
    }
    res.render("edit.ejs", { book });
});
app.post('/editbook/:id',(req,res)=>{
    const id = req.params.id;
    console.log(req.body)
    try {
        db.query("UPDATE books SET title = $1,author = $2,rating=$3,notes =$4 WHERE id = $5",[req.body.title,req.body.author,req.body.rating,req.body.notes,id])
        res.redirect('/')
    } catch (error) {
        console.log("Error while updating the data into the database",error)
    }
    res.redirect('/')
})

// Deleting a note
app.get('/delete/:id',(req,res)=>{
    const id = req.params.id;
    console.log(id)
    try {
        db.query("DELETE FROM books WHERE id = $1",[id])
        console.log("Successfully deleted!")
        res.redirect('/')
    } catch (error) {
        console.log("Error while deleting the data from the database",error)
    }
    
})
// Route for seeing notes and more info
app.get('/about/:id',async (req,res)=>{
    const id = req.params.id;
    const books = await fetchData();
    const book = books.find(b =>
        String(b.id) === String(id)
        );
        console.log(book) 
        if (!book) {
            return res.status(404).send("Book not found");
            }
            res.render("about.ejs",{book,date:book.date_read})
            })
            

// Listening at port 
app.listen(port,()=>{
    console.log(`Server is running at ${port}`)
})