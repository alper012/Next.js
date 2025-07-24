import mongoose from "mongoose";

type GlobalMongoose = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

declare global {
  // eslint-disable-next-line no-var
  var mongoose: GlobalMongoose | undefined;
}

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    "Please define the MONGODB_URI environment variable inside .env"
  );
}

let cached = global.mongoose; //global nesnesinin mongoose propertysi cached’e atanır. yoksa undefined olur

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null }; //undefined ise global.mongoose objesi oluşturulur
}

async function dbConnect(): Promise<typeof mongoose> {
  if (cached?.conn) {
    return cached.conn; // Bağlantı zaten varsa direkt dön
  }

  if (!cached?.promise) {
    //catched varsa ama promise yoksa bloga gir
    const opts = {// buffer ayari eklenecek
      bufferCommands: true,
    };

    cached = global.mongoose = { //ozel cache nesnesi olan bos mongoose burada dolduruluyor
      conn: null,
      promise: mongoose.connect(MONGODB_URI as string, opts), //db baglantisi kuruluyor
    }; // 
  }

  if (!cached) {
    throw new Error("Failed to initialize MongoDB connection");
  }

  try {
    const conn = await cached.promise; //baglanti sonucu (basarili/basarisiz)
    if (!conn) {
      throw new Error("Failed to establish MongoDB connection");
    }
    cached.conn = conn;
    return conn;
  } catch (e) {
    if (cached) {
      cached.promise = null;
    }
    throw e;
  }
}

export default dbConnect;
