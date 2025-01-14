use super::*;
use langchain_rust::schemas::Document;
use pdf_extract::{output_doc, PlainTextOutput};

#[derive(Debug, Clone)]
pub struct PdfExtractLoader {
  document: pdf_extract::Document,
}

impl PdfExtractLoader {
  pub fn new<R: Read>(reader: R) -> Result<Self, LoaderError> {
    let document = pdf_extract::Document::load_from(reader)
      .map_err(|e| LoaderError::OtherError(e.to_string()))?;
    Ok(Self { document })
  }
}

#[async_trait]
impl Loader for PdfExtractLoader {
  async fn load(
    mut self,
  ) -> Result<
    Pin<Box<dyn Stream<Item = Result<Document, LoaderError>> + Send + 'static>>,
    LoaderError,
  > {
    let mut buffer: Vec<u8> = Vec::new();
    let mut output = PlainTextOutput::new(&mut buffer as &mut dyn std::io::Write);
    output_doc(&self.document, &mut output).map_err(|e| LoaderError::OtherError(e.to_string()))?;

    let doc = langchain_rust::schemas::Document::new(String::from_utf8(buffer)?);
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
  use std::{fs::read, io::Cursor, path::PathBuf};

  #[tokio::test]
  async fn test_parse_pdf() {
    let fixtures = PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("fixtures");
    let buffer = read(fixtures.join("sample.pdf")).unwrap();

    let reader = Cursor::new(buffer);
    let loader = PdfExtractLoader::new(reader).expect("Failed to create PdfExtractLoader");

    let docs = loader
      .load()
      .await
      .unwrap()
      .map(|d| d.unwrap())
      .collect::<Vec<_>>()
      .await;

    assert_eq!(&docs[0].page_content[..100], "\n\nSample PDF\nThis is a simple PDF ﬁle. Fun fun fun.\n\nLorem ipsum dolor  sit amet,  consectetuer  a");
    assert_eq!(docs.len(), 1);
  }
}
