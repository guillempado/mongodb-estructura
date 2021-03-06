// Arxiu per executar des de la consola (bash): mongosh < youtube.js

use youtube
db.dropDatabase()
// show collections

// CREATE COLLECTIONS
db.createCollection('user');
db.createCollection('video');
db.createCollection('playlist');


// MODEL DATA

const user_ids = [ObjectId(), ObjectId()];
const video_ids = [ObjectId()];
const playlist_ids = [ObjectId()];
const tag_ids = [ObjectId(), ObjectId(), ObjectId()];


// Aquí sí que no cal que l'usuari tingui un id tipus 1,2,3... és més, per escalar horitzontalment anirà millor tenir l'id d'usuari assignat de manera distribuida (_id de mongo per defecte)
// De cara als videos publicats, penso que és interessant que la relació sigui bidireccional (que d'users es pugui anar als videos a més que videos tinguin la id de l'autor). Imagina youtube amb els millons i millons de videos, si cada cop que es vulgués mostrar els videos d'un autor s'hagués de buscar entre tots els vídeos a veure quins apunten a la id de l'usuari no acabaríem mai
// El mateix aplica als canals i playlists de què en sigui autor

const users = [
    {
        _id: user_ids[0],
        email: 'some@email.com',
        password: 'sfldknr243l23n4sdfk2j322lk',
        username: 'Guillem Parrado',
        date_of_birth: '1987-02-05',
        gender: null,
        country: 'Spain',
        postal_code: '08080',
        channel: null,
        subscribed_channels: [
            user_ids[1]
        ],
        published_playlists: null,
        subscribed_playlists: [
            playlist_ids[0]
        ],
        published_videos: null

    }, {
        _id: user_ids[1],
        email: 'some_other@email.com',
        password: 'sfldknr243l23n4sdfk2j322lk',
        username: 'Jawed Karim',
        date_of_birth: '1985-05-07',
        gender: 'male',
        country: 'USA',
        postal_code: '12345',
        // Guardo els usuaris que s'han subscrit també aquí (navegació bidireccional, usuari -> canals a què subscrit però també canal -> usuaris subscrits) per poder gestionar l'enviament de notificacions des del canal als subscriptors sense haver de consultar a tota la base de dades de Youtube de billons d'usuaris per saber quins estan subscrits al canal cada cop que es vulgui enviar l'inici d'un broadcasting per exemple
        // Com que només pot haver-hi un canal per usuari, té sentit assignar-li la mateixa id que a l'usuari per assegurar que sigui única
        channel: {
            _id: user_ids[1],
            name: 'Youtube founders',
            description: 'Official channel from the founders of youtube',
            creation_date: '2007-03-21',
            subscribed_users: [
                user_ids[0]
            ]
        },
        subscribed_channels: null,
        published_playlists: [
            playlist_ids[0]
        ],
        subscribed_playlists: null,
        published_videos: [
            video_ids[0]
        ],
    }
];

// Altre cop, no cal que l'id del video sigui diferent que el que li doni mongo per defecte
const videos = [
    {
        _id: video_ids[0],
        publishing: {
            author: user_ids[1],
            dt: '2005-04.23 15:14:37'
        },
        title: 'Me at the zoo',
        description: 'This is the very first video uploaded to the YouTube Server',
        size_in_bytes: 10231,
        filename: 'Me_at_the_zoo_-_Jawed_Karim.mp4',
        duration_in_seconds: 32,
        thumbnail: 'TLdnH2ATSTl68YkTyMJwPLnGbz1xxKgLuJP...NeUWOUVIkfj/+dveHT+tUutfdtWVqr7fma5xHX9Ns1==',
        views: 12345678,
        total_likes: 546234,
        total_dislikes: 62312,
        // Com que són excloents i només es pot votar un cop, si like == true then like, si like == false then dislike, si no existeix objecte amb la id del user a l'array then ni like ni dislike.
        likes_dislikes: [
            {
                user_id: user_ids[0],
                like: true,
                dt: '2021-08-12 13:32:05'
            }
        ],
        state: 'public',  //Estats possibles: public, ocult, privat
        // RESOLT PER TAGS: els índex poden ser sobre camps únics, per resoldre nom >> id del tag indexo els tags per nom dins de video i ja no cal col·lecció de tags
        tags: [
            {
                _id: tag_ids[0],
                name: 'First'
            }, {
                _id: tag_ids[1],
                name: 'Jawed Karim'
            }, {
                _id: tag_ids[2],
                name: 'Zoo'
            },
        ],

        // Guardo state i comments de manera independent perquè, tot i que els vídeos privats no poden rebre comentaris, si un usuari passa el vídeo a privat, que no es perdin els comentaris (i puguin tornar a ser visibles si el torna a fer públic per exemple)
        // Torno a fer servir id de Mongo perquè siguin úniques i poder-les generar sense un servei central
        comments: [
            {
                _id: ObjectId(),
                dt: '2011-03-05 18:30:11',
                author_id: user_ids[0],     //(Autor del comentari)
                comment_text: 'dfgwt dhejhew wthrwe!',
                // Altre cop, true/false per like/dislike, no existència de registre per un usuari per falta de like o dislike
                likes_dislikes: [
                    {
                        author_id: user_ids[1],     //(Autor del like/dislike)
                        dt: '2011-03-05 18:35:06',
                        like: true
                    }
                ]
            }
        ]
    }
];


// Torno a aprofitar la id de mongo
// Penso que té sentit que existeixi de manera independent de l'autor perquè té "vida pròpia" relacionada amb la resta d'usuaris + relació amb l'autor és d'un a molts
const playlists = [
    {
        _id: playlist_ids[0],
        author: user_ids[1],
        name: 'First Videos',
        creation_date: '2007-03-21',
        state: 'public',  // Estat pot ser public o private
        videos: [
            video_ids[0],
        ]
    }
];

// INSERTS

db.user.insertMany(users);
db.video.insertMany(videos);
db.playlist.insertMany(playlists);

// INDEXES
// Faig un índexs per poder trobar ids sense haver de consultar tots els documents de la base de dades
// Font: https://docs.mongodb.com/manual/indexes/
db.video.createIndex({'comments._id': 1});
db.video.createIndex({'tags._id': 1});
