use super::*;
use async_trait::async_trait;
use docx_parser::MarkdownDocument;
use futures::{stream, Stream, TryStreamExt};
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
}

#[async_trait]
impl Loader for DocxLoader {
  async fn load(
    mut self,
  ) -> Result<
    Pin<Box<dyn Stream<Item = Result<Document, LoaderError>> + Send + 'static>>,
    LoaderError,
  > {
    let doc = Document::new(self.document.to_markdown(false));
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
    let stream = self
      .load()
      .await?
      .and_then(|doc| async {
        splitter
          .split_documents(&[doc])
          .await
          .map_err(LoaderError::TextSplitterError)
      })
      .into_inner();

    Ok(Box::pin(stream))
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use futures_util::StreamExt;
  use langchain_rust::text_splitter::TokenSplitter;

  #[tokio::test]
  async fn test_parse_docx() {
    let docx_buffer = include_bytes!("../../fixtures/demo.docx");
    let parsed_buffer = include_str!("../../fixtures/demo.docx.0.md");

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

    while let Some(doc) = documents.next().await {
      assert_eq!(doc.unwrap().page_content, parsed_buffer);
    }
  }
}
