use super::*;
use async_trait::async_trait;
use docx_parser::MarkdownDocument;
use langchain_rust::schemas::Document;

#[derive(Debug)]
pub struct DocxLoader {
  document: MarkdownDocument,
}

impl DocxLoader {
  pub fn new<R: Read + Seek>(reader: R) -> Option<Self> {
    Some(Self {
      document: MarkdownDocument::from_reader(reader)?,
    })
  }

  fn extract_text(&self) -> String {
    self.document.to_markdown(false)
  }

  fn extract_text_to_doc(&self) -> Document {
    Document::new(self.extract_text())
  }
}

#[async_trait]
impl Loader for DocxLoader {
  async fn load(
    mut self,
  ) -> Result<
    Pin<Box<dyn Stream<Item = Result<Document, LoaderError>> + Send + 'static>>,
    LoaderError,
  > {
    let doc = self.extract_text_to_doc();
    let stream = stream::iter(vec![Ok(doc)]);
    Ok(Box::pin(stream))
  }

  async fn load_and_split<TS: TextSplitter + 'static>(
    mut self,
    splitter: TS,
  ) -> Result<
    Pin<Box<dyn Stream<Item = Result<Document, LoaderError>> + Send + 'static>>,
    LoaderError,
  > {
    let doc = self.extract_text_to_doc();
    let stream = splitter.split_documents(&[doc]).await?;
    Ok(Box::pin(stream::iter(stream.into_iter().map(Ok))))
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use futures_util::StreamExt;
  use langchain_rust::text_splitter::TokenSplitter;
  use std::{fs::read, path::PathBuf};

  fn get_fixtures_path() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("fixtures")
  }

  #[tokio::test]
  async fn test_parse_docx() {
    let docx_buffer = include_bytes!("../../fixtures/demo.docx");
    let parsed_buffer = include_str!("../../fixtures/demo.docx.md");

    let loader = DocxLoader::new(Cursor::new(docx_buffer)).unwrap();

    let mut documents = loader.load().await.unwrap();
    while let Some(doc) = documents.next().await {
      assert_eq!(doc.unwrap().page_content, parsed_buffer);
    }

    let loader = DocxLoader::new(Cursor::new(docx_buffer)).unwrap();
    let mut documents = loader
      .load_and_split(TokenSplitter::default())
      .await
      .unwrap();

    let mut idx = 0;
    while let Some(doc) = documents.next().await {
      assert_eq!(
        doc.unwrap().page_content,
        String::from_utf8_lossy(
          &read(get_fixtures_path().join(format!("demo.docx.{}.md", idx))).unwrap()
        )
      );
      idx += 1;
    }
  }
}
