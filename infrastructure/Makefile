AWS_REGION ?= us-east-1
AWS_ACCOUNT_ID ?= 524744845066
AWS_PROFILE ?= efflux

EFFLUX_PROD ?= Efflux-BE
EFFLUX_STAGING ?= Efflux-BE-Staging
METABASE_PROD ?= Metabase-BE

deploy-prod:
	@aws cloudformation deploy \
		--stack-name $(EFFLUX_PROD) \
		--capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM  \
		--template-file be-template.yaml \
		--parameter-overrides \
			ProjectName=efflux \
			OperatorEmail=ilyas@ad.roi\
      RDSPostgresClusterPassword=eapsU6KlwrnUWswdZ9BWnY \
    --tags \
      project=efflux \
		--profile $(AWS_PROFILE) \
		--region $(AWS_REGION)


deploy-staging:
  @aws cloudformation deploy \
    --stack-name $(EFFLUX_STAGING) \
    --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM  \
    --template-file staging-template.yaml \
    --parameter-overrides \
			ProjectName=efflux-staging \
			OperatorEmail=ilyas@ad.roi\
      RDSPostgresClusterPassword=eapsU6KlwrnUWswdZ9BWnY \
    --tags \
      project=efflux-staging \
    --profile $(AWS_PROFILE) \
    --region $(AWS_REGION)

deploy-metabase:
  @aws cloudformation deploy \
    --stack-name $(METABASE_PROD) \
    --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM \
    --template-file metabase-template.yaml \
    --parameter-overrides \
			OperatorEmail=ilyas@ad.roi\
      RDSPostgresClusterPassword=eapsU6KlwrnUWswdZ9BWnY \
    --tags project=metabase \
    --profile $(AWS_PROFILE) \
    --region $(AWS_REGION)

