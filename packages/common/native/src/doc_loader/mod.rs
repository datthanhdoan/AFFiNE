mod document;
mod docx_loader;
mod pdf_loader;

use async_trait::async_trait;
use futures::{stream, Stream, TryStreamExt};
use langchain_rust::{
  document_loaders::{Loader, LoaderError},
  text_splitter::TextSplitter,
};
use std::{
  io::{Cursor, Read, Seek},
  pin::Pin,
};

use docx_loader::DocxLoader;
use pdf_loader::PdfExtractLoader;

pub use document::{Chunk, Doc};
