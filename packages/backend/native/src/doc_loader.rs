use affine_common::doc_loader::{Chunk, Doc};
use napi::{bindgen_prelude::External, iterator::Generator};

#[napi]
pub async fn parse_doc(file_path: String, doc: &[u8]) -> Option<Document> {
  let doc = Doc::new(&file_path, doc).await?;
  Some(Document { inner: doc })
}

#[napi]
pub struct Document {
  inner: Doc,
}

#[napi]
impl Document {
  #[napi(getter)]
  pub fn name(&self) -> String {
    self.inner.name.clone()
  }

  #[napi]
  pub fn iter(&self) -> DocumentChunkIterator {
    DocumentChunkIterator {
      array: self.inner.chunks.clone(),
      current: 0,
    }
  }
}

#[napi]
pub struct DocumentChunk {
  index: i64,
  content: String,
}

#[napi]
impl DocumentChunk {
  #[napi(constructor)]
  pub fn new(index: i64, content: String) -> Self {
    Self { index, content }
  }

  #[napi(getter)]
  pub fn index(&self) -> i64 {
    self.index
  }

  #[napi(getter)]
  pub fn content(&self) -> String {
    self.content.clone()
  }
}

#[napi(iterator)]
pub struct DocumentChunkIterator {
  array: Vec<Chunk>,
  current: i64,
}

#[napi]
impl Generator for DocumentChunkIterator {
  type Yield = External<DocumentChunk>;

  type Next = Option<i64>;

  type Return = ();

  fn next(&mut self, value: Option<Self::Next>) -> Option<Self::Yield> {
    if self.array.len() <= self.current as usize {
      return None;
    }
    let ret = self.array.get(self.current as usize);
    self.current = if let Some(value) = value.and_then(|v| v) {
      value
    } else {
      self.current + 1
    };
    ret.map(|c| {
      External::new(DocumentChunk {
        index: c.index as i64,
        content: c.content.clone(),
      })
    })
  }
}
